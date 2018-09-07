"""Classes for multilingual strings, using automatic or manual translation"""
from collections import defaultdict
from datetime import datetime

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    Boolean,
    String,
    SmallInteger,
    UnicodeText,
    UniqueConstraint,
    event,
    inspect,
    Sequence,
    literal)
from sqlalchemy.sql.expression import case
from sqlalchemy.orm import relationship, backref, subqueryload, joinedload, aliased
from sqlalchemy.orm.query import Query
from sqlalchemy.ext.hybrid import hybrid_method, hybrid_property
from ..lib.sqla_types import CoerceUnicode
import simplejson as json

from . import Base, TombstonableMixin
from ..lib.abc import classproperty
from ..auth import CrudPermissions, P_READ, P_ADMIN_DISC, P_SYSADMIN


class Locale(Base):
    """The name of locales. Follows Posix locale conventions: lang(_Script)(_COUNTRY),
    (eg zh_Hant_HK, but script can be elided (eg fr_CA) if only one script for language,
    as per http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
    """
    __tablename__ = "locale"
    id = Column(Integer, primary_key=True)
    code = Column(String(32), unique=True)
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
    def is_right_to_left_code(code):
        # Good enough approximation
        parts = code.split("_")
        if len(parts) > 1:
            if parts[1] in {
                    "Arab", "Hebr", "Syrc", "Thaa", "Samr",
                    "Mand", "Mend", "Nkoo", "Adlm"}:
                return True
            elif parts[1] in {"Latn", "Cyrl", "Deva", "Guru"}:
                return False
        return parts[0] in {"ar", "he", "az", "dv", "ku", "fa", "ur"}

    @property
    def is_rtl(self):
        return self.is_right_to_left_code(self.code)

    @classmethod
    def create_mt_code(self, source_code, target_code):
        return "%s-x-mtfrom-%s" % (target_code, source_code)

    @classmethod
    def create_mt_locale(cls, source_locale, target_locale, db=None):
        return cls.get_or_create(
            cls.create_mt_code(
                source_locale.code, target_locale.code
            ),
            db=db
        )

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

    @classmethod
    def compatible(cls, locname1, locname2):
        """Are the two locales similar enough to be substituted
        one for the other. Mostly same language/script, disregard country.
        """
        # Google special case... should be done upstream ideally.
        if locname1 == 'zh':
            locname1 = 'zh_Hans'
        if locname2 == 'zh':
            locname2 = 'zh_Hans'
        loc1 = locname1.split("_")
        loc2 = locname2.split("_")
        for i in range(min(len(loc1), len(loc2))):
            if loc1[i] != loc2[i]:
                if i and len(loc1[i]) == 2:
                    # discount difference in country
                    return i
                return False
        return i + 1

    @classmethod
    def any_compatible(cls, locname, locnames):
        for l in locnames:
            if cls.compatible(l, locname):
                return True
        return False

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
        locale = locale_code.split('-x-mtfrom-', 1)
        if len(locale) == 2:
            return locale[1]

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

    @classmethod
    def get_locale_object_cache(cls):
        """Maintain a per-thread cache of locale objects by name"""
        from pyramid.threadlocal import get_current_request
        req = get_current_request()
        if not req:
            return {}
        if getattr(req, "locale_object_cache", None) is None:
            req.locale_object_cache = {}
        return req.locale_object_cache

    @classproperty
    def locale_collection_byid(cls):
        "A collection of all known locales, as a dictionary of id->strings"
        if cls._locale_collection_byid is None:
            cls._locale_collection_byid = dict(
                cls.default_db.query(cls.id, cls.code))
            # Add locales that were created, flushed but not yet committed,
            # And will not show up in the query
            uncommitted = [
                l for l in cls._locale_uncommitted
                if inspect(l).pending]
            cls._locale_uncommitted = uncommitted
            if uncommitted:
                cls._locale_collection_byid.update(
                    {l.id: l.code for l in uncommitted})
        return cls._locale_collection_byid

    @classmethod
    def code_for_id(cls, id):
        if cls._locale_collection_byid is not None and id not in cls._locale_collection_byid:
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
        if cls._locale_collection is not None and code not in cls._locale_collection:
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
        locale_object_cache = cls.get_locale_object_cache()
        locale = locale_object_cache.get(locale_code, None)
        if locale:
            return locale
        locale_id = cls.locale_collection.get(locale_code, None)
        if locale_id:
            locale = Locale.get(locale_id)
            if locale:
                locale_object_cache[locale_code] = locale
                return locale
        db = db or cls.default_db
        # Maybe exists despite not in cache
        locale = db.query(cls).filter_by(code=locale_code).first()
        if locale:
            cls.reset_cache()
            locale_object_cache[locale_code] = locale
            return locale
        # create it.
        locale = Locale(
            code=locale_code, rtl=cls.is_right_to_left_code(locale_code))
        db.add(locale)
        db.flush()
        cls._locale_uncommitted.append(locale)
        cls.reset_cache()
        locale_object_cache[locale_code] = locale
        return locale

    @classmethod
    def bulk_get_or_create(cls, locale_codes, db=None):
        db = db or cls.default_db
        db.execute("lock table %s in exclusive mode" % cls.__table__.name)
        existing = db.query(cls.code).all()
        missing = set(locale_codes) - {x for (x,) in existing}
        if not missing:
            return
        stmt = cls.__table__.insert().values([
            {
                "code": code,
                "rtl": cls.is_right_to_left_code(code)
            } for code in missing
        ])
        db.execute(stmt)

    @classproperty
    def UNDEFINED_LOCALEID(cls):
        return cls.locale_collection[cls.UNDEFINED]

    @classproperty
    def NON_LINGUISTIC_LOCALEID(cls):
        return cls.locale_collection[cls.NON_LINGUISTIC]

    crud_permissions = CrudPermissions(P_READ, P_ADMIN_DISC)

    @classmethod
    def populate_db(cls, db=None):
        cls.bulk_get_or_create([
            cls.UNDEFINED, cls.MULTILINGUAL, cls.NON_LINGUISTIC], db)


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
        nullable=False, index=True)
    locale_id_of_label = Column(
        Integer, ForeignKey(
            Locale.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
    name = Column(CoerceUnicode)

    named_locale = relationship(Locale, foreign_keys=(
        named_locale_id,))
    locale_of_label = relationship(Locale, foreign_keys=(
        locale_id_of_label,))

    @classmethod
    def names_in_locale(cls, locale):
        """Give the name of known locales in the target locale
        as a {code: name} dict"""
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
        """Give the name of given locales in the target locale
        as a {code: name} dict"""
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
        """Give the name of known locales in their own language
        as a {code: name} dict"""
        return {
            Locale.code_for_id(lname.named_locale_id): lname.name
            for lname in cls.default_db.query(cls).filter(
                cls.locale_id_of_label == cls.named_locale_id)}

    @classmethod
    def load_names(cls, db=None):
        """Populate the locale_label table."""
        from os.path import dirname, join
        db = db or cls.default_db
        fname = join(dirname(dirname(__file__)),
                     'nlp/data/language-names.json')
        with open(fname) as f:
            names = json.load(f)
        locales = {x[0] for x in names}.union({x[1] for x in names})
        Locale.bulk_get_or_create(locales, db)
        db.flush()
        Locale.reset_cache()
        db.execute("lock table %s in exclusive mode" % cls.__table__.name)
        existing = set(db.query(
            cls.named_locale_id, cls.locale_id_of_label).all())
        c = Locale.locale_collection
        values = []
        for (lcode, tcode, name) in names:
            l, t = c[lcode], c[tcode]
            if (l, t) not in existing:
                values.append({
                    'named_locale_id': l,
                    'locale_id_of_label': t,
                    'name': name})
        if values:
            db.execute(cls.__table__.insert().values(values))
            db.flush()

    @classmethod
    def populate_db(cls, db=None):
        cls.load_names(db)

    crud_permissions = CrudPermissions(P_READ, P_ADMIN_DISC)


class LangString(Base):
    """A multilingual string, composed of many :py:class:`LangStringEntry`"""
    __tablename__ = "langstring"

    @classmethod
    def subqueryload_option(cls, reln):
        return subqueryload(reln).joinedload(cls.entries)

    @classmethod
    def joinedload_option(cls, reln):
        return joinedload(reln).joinedload(cls.entries)

    id_sequence_name = "langstring_idsequence"

    @classproperty
    def id_sequence(cls):
        return Sequence(cls.id_sequence_name, schema=cls.metadata.schema)

    id = Column(Integer, primary_key=True)

    def add_entry(self, entry, allow_replacement=True):
        """Add a LangStringEntry to the langstring.
        Previous versions with the same language will be tombstoned,
        and translations based on such a version will be suppressed."""
        if entry and isinstance(entry, LangStringEntry):
            entry_locale = entry.locale or Locale.get(entry.locale_id)
            base_locale = entry_locale.base_locale
            for ex_entry in self.entries:
                # Loop on the entries means that repeated calls to
                # add_entry will be O(n^2). If this becomes an issue,
                # create an add_entries method.
                if ex_entry is entry:
                    continue
                if (ex_entry.value == entry.value and
                        ex_entry.locale_id == entry.locale_id):
                    if entry in self.entries:
                        self.entries.remove(entry)
                    return ex_entry
                ex_locale = ex_entry.locale or Locale.get(ex_entry.locale_id)
                if base_locale == ex_locale.base_locale:
                    if ex_locale.is_machine_translated:
                        self.entries.remove(ex_entry)
                    else:
                        if not allow_replacement:
                            return None
                        ex_entry.is_tombstone = True
                        self.remove_translations_of(base_locale)
                        if inspect(self).persistent:
                            self.db.expire(self, ["entries"])
            entry.langstring = self
            self.db.add(entry)
            return entry

    def remove_translations_of(self, local_code):
        """Remove all translations based on this code."""
        for trans in self.entries[:]:
            trans_locale = trans.locale or Locale.get(trans.locale_id)
            if trans_locale.machine_translated_from == local_code:
                trans.delete()

    def __repr__(self):
        return 'LangString (%d): %s\n' % (
            self.id or -1, "\n".join((repr(x) for x in self.entries)))

    @classmethod
    def create(cls, value, locale_code=Locale.UNDEFINED):
        ls = cls()
        LangStringEntry(
            langstring=ls, value=value,
            locale_id=Locale.get_id_of(locale_code))
        return ls

    def add_value(self, value, locale_code=Locale.UNDEFINED,
                  allow_replacement=True):
        return self.add_entry(LangStringEntry(
            langstring=self, value=value,
            locale_id=Locale.get_id_of(locale_code)),
            allow_replacement=allow_replacement)

    @classmethod
    def create_localized_langstring(
            cls, trans_string, desired_locales=None, known_translations=None):
        """Construct a langstring from a localized string.
        Call with a TranslationString."""
        inst = cls.create(trans_string, 'en')
        known_translations = known_translations or {}
        for loc in desired_locales or ():
            if loc == 'en':
                continue
            elif loc in known_translations:
                inst.add_value(known_translations[loc], loc)
            else:
                from pyramid.i18n import make_localizer
                from os.path import dirname, join
                loc_dir = join(dirname(dirname(__file__)), 'locale')
                localizer = make_localizer(loc, loc_dir)
                inst.add_value(localizer.translate(trans_string), loc)
        return inst

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

    @classmethod
    def EMPTY(cls, db=None):
        ls = LangString()
        e = LangStringEntry(
            langstring=ls,
            locale_id=Locale.NON_LINGUISTIC_LOCALEID)
        if db is not None:
            db.add(e)
            db.add(ls)
        return ls

    @classmethod
    def reset_cache(cls):
        pass

    # Which object owns this?
    owner_object = None
    _owning_relns = []

    @classmethod
    def setup_ownership_load_event(cls, owner_class, relns):
        def load_owner_object(target, context):
            for reln in relns:
                ls = getattr(target, reln, None)
                if ls is not None:
                    ls.owner_object = target
        event.listen(owner_class, "load", load_owner_object, propagate=True)
        event.listens_for(owner_class, "refresh", load_owner_object, propagate=True)

        def set_owner_object(target, value, old_value, initiator):
            if old_value is not None:
                old_value.owner_object = None
            if value is not None:
                value.owner_object = target
        for reln in relns:
            cls._owning_relns.append((owner_class, reln))
            event.listen(getattr(owner_class, reln), "set", set_owner_object, propagate=True)

    def get_owner_object(self):
        if self.owner_object is None and inspect(self).persistent:
            self.owner_object = self.owner_object_from_query()
        return self.owner_object

    def owner_object_from_query(self):
        queries = []
        for owning_class, reln_name in self._owning_relns:
            backref_name = owning_class.__mapper__.relationships[reln_name].backref[0]
            query = getattr(self, backref_name)
            query = query.with_entities(owning_class.id, literal(owning_class.__name__).label('classname'))
            queries.append(query)
        query = queries[0].union(*queries[1:])
        data = query.first()
        if data:
            id, cls_name = data
            cls = [cls for (cls, _) in self._owning_relns if cls.__name__ == cls_name][0]
            return self.db.query(cls).filter_by(id=id).first()

    def user_can(self, user_id, operation, permissions):
        owner_object = self.get_owner_object()
        if owner_object is not None:
            return owner_object.user_can(user_id, operation, permissions)
        return super(LangString, self).user_can(user_id, operation, permissions)

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
            return LangStringEntry.EMPTY()
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
            if not isinstance(user_prefs, LanguagePreferenceCollection):
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
                            best = self.closest_entry(pref.translate_to_code)
                            if best:
                                return best
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

    def closest_entry(self, target_locale, filter_errors=True):
        def common_len(e):
            return Locale.compatible(
                target_locale,
                Locale.extract_base_locale(e.locale_code))
        if filter_errors:
            entries = [(common_len(e), e) for e in self.entries if not e.error_code]
        else:
            entries = [(common_len(e), e) for e in self.entries]
        if entries:
            entries.sort(reverse=True)
            if entries[0][0]:
                return entries[0][1]

    def simplistic_best_entries_with_originals_in_request(self):
        from pyramid.threadlocal import get_current_request
        r = get_current_request()
        # CAN ONLY BE CALLED IF THERE IS A CURRENT REQUEST.
        assert r
        locale = r.locale_name
        # Or should I use assembl.views.get_locale_from_request ?
        return self.simplistic_best_entries_with_originals(locale)

    def simplistic_best_entries_with_originals(self, target_locale):
        """For v2, where user cannot manipulate languagePreferenceCollection
        Always give the version of the Assembl UI and the original;
        but also say whether the original is understood or not.
        We could send a boolean indicating whether the language is deemed understood,
        but either way first entry should be shown to user. (original if understood,
        translation if original isn't)
        """
        from .auth import LanguagePreferenceCollection
        for lse in self.non_mt_entries():
            if Locale.compatible(lse.locale_code, target_locale):
                return [(lse, True)]
                # return [lse]
        original = self.first_original()
        best = self.closest_entry(target_locale)
        prefs = LanguagePreferenceCollection.getCurrent()
        pref = prefs.find_locale(target_locale, self.db)
        if best:
            if pref.translate_to:
                return [(best, True), (original, False)]
                # return [best, original]
            else:
                return [(original, True), (best, True)]
                # return [original, best]
        else:
            # missing translation
            return [(original, not pref.translate_to)]
            # return [original]

    def remove_translations(self, forget_identification=True):
        for entry in list(self.entries):
            if Locale.locale_is_machine_translated(entry.locale_code):
                entry.delete()
            elif forget_identification:
                entry.forget_identification(True)
        if inspect(self).persistent:
            self.db.expire(self, ["entries"])

    def clone(self, db=None, tombstone=None):
        if tombstone is True:
            tombstone = datetime.utcnow()
        clone = self.__class__()
        db = db or clone.db
        for e in self.entries:
            e = e.clone(clone, db=db, tombstone=tombstone)
            db.add(e)
        db.add(clone)
        return clone

    # Those permissions are for an ownerless object. Accept Create before ownership.
    crud_permissions = CrudPermissions(P_READ, P_SYSADMIN, P_SYSADMIN, P_SYSADMIN)


class LangStringEntry(TombstonableMixin, Base):
    """A string bound to a given :py:class:`Locale`. Many of those form a :py:class:`LangString`"""
    __tablename__ = "langstring_entry"
    __table_args__ = (
        UniqueConstraint("langstring_id", "locale_id", "tombstone_date"),
    )

    def __init__(self, session=None, *args, **kwargs):
        """ in the kwargs, you can specify locale info in many ways:
        as a Locale numeric id (locale_id), Locale object (locale)
        or language code (@language)"""
        if "locale_id" not in kwargs and "locale" not in kwargs and '@language' in kwargs:
            # Create locale on demand.
            locale_code = kwargs.get("@language", "und")
            del kwargs["@language"]
            kwargs["locale"] = Locale.get_or_create(locale_code, session)
        super(LangStringEntry, self).__init__(*args, **kwargs)

    id = Column(Integer, primary_key=True)
    langstring_id = Column(
        Integer, ForeignKey(LangString.id, ondelete="CASCADE"),
        nullable=False, index=True)
    langstring = relationship(
        LangString,
        primaryjoin="LangString.id==LangStringEntry.langstring_id",
        backref=backref(
            "entries",
            primaryjoin="and_(LangString.id==LangStringEntry.langstring_id, "
                        "LangStringEntry.tombstone_date == None)",
            cascade="all, delete-orphan"))
    # Should we allow locale-less LangStringEntry? (for unknown...)
    locale_id = Column(
        Integer, ForeignKey(
            Locale.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False, index=True)
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
    value = Column(UnicodeText)  # not searchable in virtuoso

    def clone(self, langstring, db=None, tombstone=None):
        if tombstone is True:
            tombstone = datetime.utcnow()
        clone = self.__class__(
            langstring=langstring,
            locale_id=self.locale_id,
            value=self.value,
            tombstone_date=self.tombstone_date or (
                tombstone if tombstone else None),
            locale_identification_data=self.locale_identification_data,
            locale_confirmed=self.locale_confirmed,
            error_code=self.error_code,
            error_count=self.error_count)
        db = db or self.db
        db.add(clone)
        return clone

    def __repr__(self):
        value = self.value or ''
        if len(value) > 50:
            value = value[:50] + '...'
        if self.error_code:
            return (u'%d: [%s, ERROR %d] "%s"' % (
                self.id or -1,
                self.locale_code or "missing",
                self.error_code,
                value)).encode('utf-8')
        return (u'%d: [%s] "%s"' % (
            self.id or -1,
            self.locale_code or "missing",
            value)).encode('utf-8')

    @property
    def locale_code(self):
        if self.locale_id:
            # optimization, avoids db load
            return Locale.code_for_id(self.locale_id)
        elif self.locale:
            return self.locale.code

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
    def base_locale(self):
        return Locale.extract_base_locale(self.locale_code)

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

    def identify_locale(self, locale_code, data, certainty=False):
        # A translation service proposes a data identification.
        # the information is deemed confirmed if it fits the initial
        # hypothesis given at LSE creation.
        changed = False
        old_locale_code = self.locale_code
        langstring = self.langstring or (
            LangString.get(self.langstring_id) if self.langstring_id else None)
        if Locale.locale_is_machine_translated(self.locale_code):
            raise RuntimeError("Why identify a machine-translated locale?")
        data = data or {}
        original = self.locale_identification_data_json.get("original", None)
        if not locale_code or locale_code == Locale.UNDEFINED:
            if not self.locale_code or self.locale_code == Locale.UNDEFINED:
                # replace id data with new one.
                if original:
                    data['original'] = original
                self.locale_identification_data_json = data
            return False
        elif original and locale_code == original:
            if locale_code != old_locale_code:
                self.locale_code = locale_code
                changed = True
            self.locale_identification_data_json = data
            self.locale_confirmed = True
        elif locale_code != old_locale_code:
            if self.locale_confirmed:
                if certainty:
                    raise RuntimeError("Conflict of certainty")
                # keep the old confirming data
                return False
            # compare data? replacing with new for now.
            if not original and self.locale_identification_data:
                original = Locale.UNDEFINED
            original = original or old_locale_code
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
        if changed:
            if langstring:
                langstring.remove_translations_of(old_locale_code)
                # Re-adding to verify there's no conflict
                added = langstring.add_entry(self, certainty)
                if added is None:
                    # We identified an entry with something that existed
                    # as a known original. Not sure what to do now,
                    # reverting just in case.
                    self.locale_code = old_locale_code
                    changed = False
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
        self.error_code = None
        self.error_count = 0

    def user_can(self, user_id, operation, permissions):
        if self.langstring is not None:
            return self.langstring.user_can(user_id, operation, permissions)
        return super(LangStringEntry, self).user_can(user_id, operation, permissions)

    # Those permissions are for an ownerless object. Accept Create before ownership.
    crud_permissions = CrudPermissions(P_READ, P_SYSADMIN, P_SYSADMIN, P_SYSADMIN)


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


def includeme(config):
    pass
