from collections import defaultdict
from datetime import datetime

from sqlalchemy import (
    Column, ForeignKey, Integer, Boolean, String, SmallInteger,
    UnicodeText, UniqueConstraint, event, inspect)
from sqlalchemy.sql.expression import case
from sqlalchemy.orm import (
    relationship, backref, subqueryload, joinedload, aliased)
from sqlalchemy.orm.query import Query
from sqlalchemy.orm.collections import attribute_mapped_collection
from sqlalchemy.ext.hybrid import hybrid_method, hybrid_property
from virtuoso.alchemy import CoerceUnicode
import simplejson as json

from . import Base, TombstonableMixin
from ..lib import config
from ..lib.abc import classproperty
from ..auth import CrudPermissions, P_READ, P_ADMIN_DISC, P_SYSADMIN


class Locale(Base):
    """The name of locales. Follows Posix locale conventions: lang(_Script)(_COUNTRY),
    (eg zh_Hant_HK, but script can be elided (eg fr_CA) if only one script for language,
    as per http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
    """
    __tablename__ = "locale"
    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True)
    rtl = Column(Boolean, server_default="0", doc="right-to-left")
    _locale_collection = None
    _locale_collection_byid = None
    _locale_collection_subsets = None
    _locale_uncommitted = []
    UNDEFINED = "und"
    NON_LINGUISTIC = "zxx"
    MULTILINGUAL = "mul"
    SPECIAL_LOCALES = [UNDEFINED, NON_LINGUISTIC, MULTILINGUAL]

    def __repr__(self):
        return "<Locale %s (%d)>" % (self.code, self.id or -1)

    def sublocale_of(self, locale_code):
        if isinstance(locale_code, self.__class__):
            locale_code = locale_code.code
        my_parts = self.code.split("_")
        parts = locale_code.split("_")
        if len(my_parts) > len(parts):
            return False
        my_parts = my_parts[:len(parts)]
        return my_parts == parts

    def ancestry(self):
        while self:
            yield self
            ancestor = "_".join(self.code.split("_")[:-1])
            if not ancestor:
                break
            self = self.get_or_create(ancestor)

    @staticmethod
    def decompose_locale(locale_code):
        parts = locale_code.split('_')
        for l in range(len(parts), 0, -1):
            yield "_".join(parts[:l])

    @staticmethod
    def common_parts(locname1, locname2):
        loc1 = locname1.split("_")
        loc2 = locname2.split("_")
        for i in range(min(len(loc1), len(loc2))):
            if loc1[i] != loc2[i]:
                break
        else:
            i += 1
        if i:
            return "_".join(loc1[:i])

    @staticmethod
    def len_common_parts(locname1, locname2):
        loc1 = locname1.split("_")
        loc2 = locname2.split("_")
        for i in range(min(len(loc1), len(loc2))):
            if loc1[i] != loc2[i]:
                break
        else:
            i += 1
        return i

    @staticmethod
    def locale_is_machine_translated(locale_code):
        return '-x-mtfrom-' in locale_code

    @hybrid_property
    def is_machine_translated(self):
        # Fails. May need a special comparator.
        # https://groups.google.com/forum/#!topic/sqlalchemy/g74TnQosp4k
        return self.locale_is_machine_translated(self.code)

    @is_machine_translated.expression
    def is_machine_translated(cls):
        return cls.code.like("%-x-mtfrom-%")

    @staticmethod
    def extract_translated_from_locale(locale_code):
        l = locale_code.split('-x-mtfrom-', 1)
        if len(l) == 2:
            return l[1]

    @property
    def machine_translated_from(self):
        return self.extract_translated_from_locale(self.code)

    @staticmethod
    def extract_base_locale(locale_code):
        return locale_code.split('-x-mtfrom-', 1)[0]

    @property
    def base_locale(self):
        return self.extract_base_locale(self.code)

    @staticmethod
    def extract_root_locale(locale_code):
        return locale_code.split('-x-mtfrom-', 1)[0].split('_')[0]

    @property
    def root_locale(self):
        return self.extract_root_locale(self.code)

    @classmethod
    def reset_cache(cls):
        cls._locale_collection_byid = None
        cls._locale_collection = None
        cls._locale_collection_subsets = None

    @classproperty
    def locale_collection_byid(cls):
        "A collection of all known locales, as a dictionary of id->strings"
        if cls._locale_collection_byid is None:
            cls._locale_collection_byid = dict(
                cls.default_db.query(cls.id, cls.code))
            # Add locales that were created, flushed but not yet committed,
            # And will not show up in the query
            uncommitted = [
                l for l in cls._locale_uncommitted if not inspect(l).expired]
            cls._locale_uncommitted = uncommitted
            if uncommitted:
                cls._locale_collection_byid.update(
                    {l.id: l.code for l in uncommitted})
        return cls._locale_collection_byid

    @classmethod
    def code_for_id(cls, id):
        if (cls._locale_collection_byid is not None
                and id not in cls._locale_collection_byid):
            # may have been created in another process
            cls.reset_cache()
        return cls.locale_collection_byid[id]

    @classproperty
    def locale_collection(cls):
        "A collection of all known locales, as a dictionary of string->id"
        if cls._locale_collection is None:
            cls._locale_collection = {
                name: id for (id, name)
                in cls.locale_collection_byid.iteritems()}
        return cls._locale_collection

    @classmethod
    def get_id_of(cls, code, create=True):
        if (cls._locale_collection is not None
                and code not in cls._locale_collection):
            # may have been created in another process
            if create:
                return cls.get_or_create(code).id
            else:
                cls.reset_cache()
        return cls.locale_collection.get(code, None)

    @classproperty
    def locale_collection_subsets(cls):
        "A dictionary giving all the know locale variants for a base locale"
        if cls._locale_collection_subsets is None:
            # This is used often enough to be worth caching
            collections = cls.locale_collection
            collection_subsets = defaultdict(set)
            for locale_code in collections.iterkeys():
                collection_subsets[cls.extract_root_locale(locale_code)].add(locale_code)
            cls._locale_collection_subsets = collection_subsets
        return cls._locale_collection_subsets

    @classmethod
    def get_or_create(cls, locale_code, db=None):
        locale_id = cls.locale_collection.get(locale_code, None)
        if locale_id:
            return Locale.get(locale_id)
        db = db or cls.default_db
        # Maybe exists despite not in cache
        locale = db.query(cls).filter_by(code=locale_code).first()
        if locale:
            cls.reset_cache()
            return locale
        # create it.
        l = Locale(code=locale_code)
        db.add(l)
        db.flush()
        cls._locale_uncommitted.append(l)
        cls.reset_cache()
        return l

    @classproperty
    def UNDEFINED_LOCALEID(cls):
        return cls.locale_collection[cls.UNDEFINED]

    @classproperty
    def NON_LINGUISTIC_LOCALEID(cls):
        return cls.locale_collection[cls.NON_LINGUISTIC]

    crud_permissions = CrudPermissions(P_READ, P_ADMIN_DISC)


@event.listens_for(Locale, 'after_insert', propagate=True)
@event.listens_for(Locale, 'after_delete', propagate=True)
def locale_collection_changed(target, value, oldvalue):
    # Reset the collections
    Locale._locale_collection_subsets = None
    Locale._locale_collection = None
    Locale._locale_collection_byid = None


class LocaleLabel(Base):
    "Allows to obtain the name of locales (in any target locale, incl. itself)"
    __tablename__ = "locale_label"
    __table_args__ = (UniqueConstraint('named_locale_id', 'locale_id_of_label'), )
    id = Column(Integer, primary_key=True)
    named_locale_id = Column(
        Integer, ForeignKey(
            Locale.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    locale_id_of_label = Column(
        Integer, ForeignKey(
            Locale.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    name = Column(CoerceUnicode)

    named_locale = relationship(Locale, foreign_keys=(
            named_locale_id,))
    locale_of_label = relationship(Locale, foreign_keys=(
            locale_id_of_label,))

    @classmethod
    def names_in_locale(cls, locale):
        loc_ids = [loc.id for loc in locale.ancestry()]
        locale_labels = locale.db.query(cls).filter(
            cls.locale_id_of_label.in_(loc_ids)).all()
        by_target = defaultdict(list)
        for ln in locale_labels:
            by_target[ln.locale_id_of_label].append(ln)
        result = dict()
        loc_ids.reverse()
        for loc_id in loc_ids:
            result.update({
                Locale.code_for_id(lname.named_locale_id): lname.name
                for lname in by_target[loc_id]})
        return result

    @classmethod
    def names_of_locales_in_locale(cls, loc_codes, target_locale):
        locale_ids = [Locale.get_id_of(loc_code) for loc_code in loc_codes]
        target_loc_ids = [loc.id for loc in target_locale.ancestry()]
        locale_labels = target_locale.db.query(cls).filter(
            cls.locale_id_of_label.in_(target_loc_ids),
            cls.named_locale_id.in_(locale_ids)).all()
        by_target = defaultdict(list)
        for ln in locale_labels:
            by_target[ln.locale_id_of_label].append(ln)
        result = dict()
        target_loc_ids.reverse()
        for loc_id in target_loc_ids:
            result.update({
                Locale.code_for_id(lname.named_locale_id): lname.name
                for lname in by_target[loc_id]})
        return result

    @classmethod
    def names_in_self(cls):
        return {
            Locale.code_for_id(lname.named_locale_id): lname.name
            for lname in cls.default_db.query(cls).filter(
                cls.locale_id_of_label == cls.named_locale_id)}

    @classmethod
    def load_names(cls):
        from os.path import dirname, join
        db = cls.default_db
        fname = join(dirname(dirname(__file__)),
                     'nlp/data/language-names.json')
        with open(fname) as f:
            names = json.load(f)
        locales = {x[0] for x in names}
        for l in locales:
            db.add(Locale.get_or_create(l))
        db.flush()
        Locale.reset_cache()
        existing = set(db.query(cls.named_locale_id, cls.locale_id_of_label).all())
        c = Locale.locale_collection
        for (lcode, tcode, name) in names:
            l, t = c[lcode], c[tcode]
            if (l, t) not in existing:
                cls.default_db.add(cls(
                    named_locale_id=l, locale_id_of_label=t, name=name))
        db.flush()

    crud_permissions = CrudPermissions(P_READ, P_ADMIN_DISC)


class LangString(Base):
    __tablename__ = "langstring"
    id = Column(Integer, primary_key=True)

    @classmethod
    def subqueryload_option(cls, reln):
        return subqueryload(reln).joinedload(cls.entries)

    @classmethod
    def joinedload_option(cls, reln):
        return joinedload(reln).joinedload(cls.entries)

    @classproperty
    def id_sequence_name(cls):
        return "%s.%s.langstring_idsequence" % (
            config.get("db_schema"), config.get("db_user"))

    def _before_insert(self):
        (id,) = next(iter(self.db.execute(
            "select sequence_next('%s')" % self.id_sequence_name)))
        self.id = id

    def __repr__(self):
        return 'LangString (%d): %s\n' % (
            self.id or -1, "\n".join((repr(x) for x in self.entries)))

    @classmethod
    def create(cls, value, locale_code=Locale.UNDEFINED):
        ls = cls()
        lse = LangStringEntry(
            langstring=ls, value=value,
            locale_id=Locale.get_id_of(locale_code))
        return ls

    @property
    def entries_as_dict(self):
        return {e.locale_id: e for e in self.entries}

    @hybrid_method
    def non_mt_entries(self):
        return [e for e in self.entries
                if not Locale.locale_is_machine_translated(
                    Locale.code_for_id(e.locale_id))]

    @non_mt_entries.expression
    def non_mt_entries(self):
        return self.db.query(LangStringEntry).join(Locale).filter(
            Locale.code.notlike("%-x-mtfrom-%")).subquery()

    def first_original(self):
        return next(iter(self.non_mt_entries()))

    _EMPTY_ID = None

    @classproperty
    def EMPTY_ID(cls):
        if cls._EMPTY_ID is None:
            from sqlalchemy.sql.expression import func
            id = LangStringEntry.default_db.query(
                LangStringEntry.langstring_id).join(
                LangStringEntry.locale).filter(
                func.length(LangStringEntry.value) == 0,
                ~LangStringEntry.is_machine_translated).order_by(
                LangStringEntry.langstring_id).first()
            if id:
                cls._EMPTY_ID = id[0]
            else:
                ls = cls()
                cls.default_db.add(ls)
                entry = LangStringEntry(
                    value="", locale_id=Locale.UNDEFINED_LOCALEID,
                    langstring=ls)
                cls.default_db.add(entry)
                cls.default_db.flush()
                cls._EMPTY_ID = ls.id
        return cls._EMPTY_ID

    @classmethod
    def EMPTY(cls, db):
        return cls.get(cls.EMPTY_ID)

    @classmethod
    def reset_cache(cls):
        cls._EMPTY_ID = None

    # TODO: Reinstate when the javascript can handle empty body/subject.
    # def generic_json(
    #         self, view_def_name='default', user_id=None,
    #         permissions=(P_READ, ), base_uri='local:'):
    #     if self.id == self.EMPTY_ID:
    #         return None
    #     return super(LangString, self).generic_json(
    #         view_def_name=view_def_name, user_id=user_id,
    #         permissions=permissions, base_uri=base_uri)

    @property
    def undefined_entry(self):
        und_id = Locale.UNDEFINED_LOCALEID
        for x in self.entries:
            if x.locale_id == und_id:
                return x

    @hybrid_method
    def best_lang_old(self, locale_codes):
        # based on a simple ordered list of locale_codes
        locale_collection = Locale.locale_collection
        locale_collection_subsets = Locale.locale_collection_subsets
        available = self.entries_as_dict
        if len(available) == 0:
            return LangStringEntry.EMPTY
        if len(available) == 1:
            # optimize for common case
            return available[0]
        for locale_code in locale_codes:
            # is the locale there?
            locale_id = locale_collection.get(locale_code, None)
            if locale_id and locale_id in available:
                return available[locale_id]
            # is the base locale there?
            root_locale = Locale.extract_root_locale(locale_code)
            if root_locale not in locale_codes:
                locale_id = locale_collection.get(root_locale, None)
                if locale_id and locale_id in available:
                    return available[locale_id]
            # is another variant there?
            mt_variants = list()
            for sublocale in locale_collection_subsets[root_locale]:
                if sublocale in locale_codes:
                    continue
                if sublocale == root_locale:
                    continue
                if Locale.locale_is_machine_translated(sublocale):
                    mt_variants.append(sublocale)
                    continue
                locale_id = locale_collection.get(sublocale, None)
                if locale_id and locale_id in available:
                    return available
        # We found nothing, look at MT variants.
        for sublocale in mt_variants:
            locale_id = locale_collection.get(sublocale, None)
            if locale_id and locale_id in available:
                return available[locale_id]
        # TODO: Look at other languages in the country?
        # Give up and give nothing, or give first?

    @best_lang_old.expression
    def best_lang_old(self, locale_codes):
        # Construct an expression that will find the best locale according to list.
        scores = {}
        current_score = 1
        locale_collection = Locale.locale_collection
        locale_collection_subsets = Locale.locale_collection_subsets
        for locale_code in locale_codes:
            # is the locale there?
            locale_id = locale_collection.get(locale_code, None)
            if locale_id:
                scores[locale_id] = current_score
                current_score += 1
            # is the base locale there?
            root_locale = Locale.extract_root_locale(locale_code)
            if root_locale not in locale_codes:
                locale_id = locale_collection.get(root_locale, None)
                if locale_id:
                    scores[locale_id] = current_score
                    current_score += 1
            # is another variant there?
            mt_variants = list()
            found = False
            for sublocale in locale_collection_subsets[root_locale]:
                if sublocale in locale_codes:
                    continue
                if sublocale == root_locale:
                    continue
                if Locale.locale_is_machine_translated(sublocale):
                    mt_variants.append(sublocale)
                    continue
                locale_id = locale_collection.get(sublocale, None)
                if locale_id:
                    scores[locale_id] = current_score
                    found = True
            if found:
                current_score += 1
        # Put MT variants as last resort.
        for sublocale in mt_variants:
            locale_id = locale_collection.get(sublocale, None)
            if locale_id:
                scores[locale_id] = current_score
                # Assume each mt variant to have a lower score.
                current_score += 1
        c = case(scores, value=LangStringEntry.locale_id,
                 else_=current_score)
        q = Query(LangStringEntry).order_by(c).limit(1).subquery()
        return aliased(LangStringEntry, q)

    def best_lang(self, user_prefs=None, allow_errors=True):
        from .auth import LanguagePreferenceCollection
        # Get the best langStringEntry among those available using user prefs.
        # 1. Look at available original languages: get corresponding pref.
        # 2. Sort prefs (same order as original list.)
        # 3. take first applicable w/o trans or whose translation is available.
        # 4. if none, look at available translations and repeat.
        # Logic is painful, but most of the time (single original)
        # will be trivial in practice.
        if len(self.entries) == 1:
            return self.entries[0]
        if user_prefs:
            if not isinstance(user_prefs, dict):
                # Often worth doing upstream
                user_prefs = LanguagePreferenceCollection.getCurrent()
            for use_originals in (True, False):
                entries = filter(
                    lambda e: e.is_machine_translated != use_originals,
                    self.entries)
                if not allow_errors:
                    entries = filter(lambda e: not e.error_code, entries)
                if not entries:
                    continue
                candidates = []
                entriesByLocale = {}
                for entry in entries:
                    pref = user_prefs.find_locale(
                        Locale.extract_base_locale(entry.locale_code))
                    if pref:
                        candidates.append(pref)
                        entriesByLocale[pref.locale_code] = entry
                    elif use_originals:
                        # No pref for original, just return the original entry
                        return entry
                if candidates:
                    candidates.sort()
                    entries = list(self.entries)
                    if not allow_errors:
                        entries = filter(lambda e: not e.error_code, entries)
                    for pref in candidates:
                        if pref.translate_to:
                            target_locale = pref.translate_to_code

                            def common_len(e):
                                return Locale.len_common_parts(
                                    target_locale,
                                    Locale.extract_base_locale(e.locale_code))
                            common_entries = filter(common_len, entries).sort(
                                key=common_len, reverse=True)
                            if common_entries:
                                return common_entries[0]
                        else:
                            return entriesByLocale[pref.locale_code]
        # give up and give first original
        entries = self.non_mt_entries()
        if entries:
            return entries[0]
        # or first entry
        return self.entries[0]

    def best_entry_in_request(self):
        from .auth import LanguagePreferenceCollection
        # Use only when a request is in context, eg view_def
        return self.best_lang(
            LanguagePreferenceCollection.getCurrent(), False)

    def best_entries_in_request_with_originals(self):
        from .auth import LanguagePreferenceCollection
        "Give both best and original (for view_def); avoids a roundtrip"
        # Use only when a request is in context, eg view_def
        prefs = LanguagePreferenceCollection.getCurrent()
        lang = self.best_lang(prefs)
        entries = [lang]
        # Punt this.
        # if lang.error_code:
        #     # Wasteful to call twice, but should be rare.
        #     entries.append(self.best_lang(prefs, False))
        if all((e.is_machine_translated for e in entries)):
            entries.extend(self.non_mt_entries())
        return entries

    def remove_translations(self):
        for entry in self.entries:
            if Locale.locale_is_machine_translated(entry.locale_code):
                entry.delete()
            else:
                entry.forget_identification(True)
        if inspect(self).persistent:
            self.db.expire(self, ["entries"])

    # TODO: the permissions should really be those of the owning object. Yikes.
    crud_permissions = CrudPermissions(P_READ, P_READ, P_SYSADMIN)


@event.listens_for(LangString, 'before_insert', propagate=True)
def receive_before_insert(mapper, connection, target):
    target._before_insert()


class LangStringEntry(Base, TombstonableMixin):
    __tablename__ = "langstring_entry"
    __table_args__ = (
        UniqueConstraint("langstring_id", "locale_id", "tombstone_date"),
    )

    def __init__(self, *args, **kwargs):
        """ in the kwargs, you can specify locale info in many ways:
        as a Locale numeric id (locale_id), Locale object (locale)
        or language code (@language)"""
        if ("locale_id" not in kwargs and "locale" not in kwargs
                and '@language' in kwargs):
            # Create locale on demand.
            locale_code = kwargs.get("@language", "und")
            del kwargs["@language"]
            kwargs["locale"] = Locale.get_or_create(locale_code)
        super(LangStringEntry, self).__init__(*args, **kwargs)

    id = Column(Integer, primary_key=True)
    langstring_id = Column(
        Integer, ForeignKey(LangString.id, ondelete="CASCADE"),
        nullable=False, index=True)
    langstring = relationship(
        LangString, backref=backref("entries", cascade="all, delete-orphan"))
    # Should we allow locale-less LangStringEntry? (for unknown...)
    locale_id = Column(
        Integer, ForeignKey(
            Locale.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    locale = relationship(Locale)
    locale_identification_data = Column(String)
    locale_confirmed = Column(
        Boolean, server_default="0",
        doc="Locale inferred from discussion agrees with identification_data")
    error_count = Column(
        Integer, default=0,
        doc="Errors from the translation server")
    error_code = Column(
        SmallInteger, default=None,
        doc="Type of error from the translation server")
    # tombstone_date = Column(DateTime) implicit from Tombstonable mixin
    value = Column(UnicodeText, default="")  # not searchable in virtuoso

    def __repr__(self):
        value = self.value or ''
        if len(value) > 50:
            value = value[:50]+'...'
        return '%d: [%s] "%s"' % (
            self.id or -1,
            self.locale.code if self.locale else "missing",
            value.encode('utf-8'))

    @property
    def locale_code(self):
        return Locale.code_for_id(self.locale_id)
        # Equivalent to the following, which may trigger a DB load
        # return self.locale.code

    @locale_code.setter
    def locale_code(self, locale_code):
        locale_id = Locale.locale_collection.get(locale_code, None)
        if locale_id:
            if locale_id == self.locale_id:
                return
            self.locale_id = locale_id
            if inspect(self).persistent:
                self.db.expire(self, ["locale"])
            else:
                self.locale = Locale.get(locale_id)
        else:
            self.locale = Locale.get_or_create(locale_code)

    @property
    def locale_identification_data_json(self):
        return json.loads(self.locale_identification_data)\
            if self.locale_identification_data else {}

    @locale_identification_data_json.setter
    def locale_identification_data_json(self, data):
        self.locale_identification_data = json.dumps(data) if data else None

    @hybrid_property
    def is_machine_translated(self):
        return Locale.locale_is_machine_translated(
            Locale.code_for_id(self.locale_id))

    @is_machine_translated.expression
    def is_machine_translated(cls):
        # Only works if the Locale is part of the join
        return Locale.is_machine_translated

    def change_value(self, new_value):
        self.tombstone = datetime.utcnow()
        new_version = self.__class__(
            langstring_id=self.langstring_id,
            locale_id=self.locale_id,
            value=new_value)
        self.db.add(new_version)
        return new_version

    def identify_locale(self, locale_code, data, certainty=False):
        # A translation service proposes a data identification.
        # the information is deemed confirmed if it fits the initial
        # hypothesis given at LSE creation.
        changed = False
        if self.locale.is_machine_translated:
            raise RuntimeError("Why identify a machine-translated locale?")
        data = data or {}
        original = self.locale_identification_data_json.get("original", None)
        if not locale_code:
            if not self.locale_code or self.locale_code == Locale.UNDEFINED:
                # replace id data with new one.
                if original:
                    data['original'] = original
                self.locale_identification_data_json = data
            return False
        elif original and locale_code == original:
            if locale_code != self.locale_code:
                self.locale_code = locale_code
                changed = True
            self.locale_identification_data_json = data
            self.locale_confirmed = True
        elif locale_code != self.locale_code:
            if self.locale_confirmed:
                if certainty:
                    raise RuntimeError("Conflict of certainty")
                # keep the old confirming data
                return False
            # compare data? replacing with new for now.
            if not original and self.locale_identification_data:
                original = Locale.UNDEFINED
            original = original or self.locale_code
            if original != locale_code and original != Locale.UNDEFINED:
                data["original"] = original
            self.locale_code = locale_code
            changed = True
            self.locale_identification_data_json = data
            self.locale_confirmed = certainty
        else:
            if original and original != locale_code:
                data['original'] = original
            self.locale_identification_data_json = data
            self.locale_confirmed = certainty or locale_code == original
        return changed

    def forget_identification(self, force=False):
        if force:
            self.locale_code = Locale.UNDEFINED
            self.locale_confirmed = False
        elif not self.locale_confirmed:
            data = self.locale_identification_data_json
            orig = data.get("original", None)
            if orig and orig != self.locale_code:
                self.locale_code = orig
        self.locale_identification_data = None

    crud_permissions = CrudPermissions(P_READ, P_READ, P_SYSADMIN)


# class TranslationStamp(Base):
#     "For future reference. Not yet created."
#     __tablename__ = "translation_stamp"
#     id = Column(Integer, primary_key=True)
#     source = Column(Integer, ForeignKey(LangStringEntry.id))
#     dest = Column(Integer, ForeignKey(LangStringEntry.id))
#     translator = Column(Integer, ForeignKey(User.id))
#     created = Column(DateTime, server_default="now()")
#     crud_permissions = CrudPermissions(
#          P_TRANSLATE, P_READ, P_SYSADMIN, P_SYSADMIN,
#          P_TRANSLATE, P_TRANSLATE)


def populate_default_locales(db):
    for loc_code in (
            Locale.UNDEFINED, Locale.MULTILINGUAL, Locale.NON_LINGUISTIC):
        Locale.get_or_create(loc_code, db=db)
    LangString.EMPTY_ID


def includeme(config):
    pass
