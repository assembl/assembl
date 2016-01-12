from collections import defaultdict
from datetime import datetime

from sqlalchemy import (
    Column, ForeignKey, Integer, Boolean, String,
    UnicodeText, UniqueConstraint, event)
from sqlalchemy.sql.expression import case
from sqlalchemy.orm import (
    relationship, backref, subqueryload, joinedload, aliased)
from sqlalchemy.orm.query import Query
from sqlalchemy.orm.collections import attribute_mapped_collection
from sqlalchemy.ext.hybrid import hybrid_method, hybrid_property
from virtuoso.alchemy import CoerceUnicode

from . import Base, TombstonableMixin
from ..lib import config
from ..lib.abc import classproperty
from ..auth import CrudPermissions, P_READ, P_ADMIN_DISC, P_SYSADMIN


class Locale(Base):
    __tablename__ = "locale"
    id = Column(Integer, primary_key=True)
    locale = Column(String(20), unique=True)
    rtl = Column(Boolean, server_default="0")
    _locale_collection = None
    _locale_collection_byid = None
    _locale_collection_subsets = None
    UNDEFINED = "und"
    NON_LINGUISTIC = "zxx"
    MULTILINGUAL = "mul"

    def __repr__(self):
        return "<Locale %s (%d)>" % (self.locale, self.id or -1)

    def sublocale_of(self, locale_name):
        if isinstance(locale_name, self.__class__):
            locale_name = locale_name.locale
        my_parts = self.locale.split("_")
        parts = locale_name.split("_")
        if len(my_parts) > len(parts):
            return False
        my_parts = my_parts[:len(parts)]
        return my_parts == parts

    @staticmethod
    def locale_is_machine_translated(locale):
        return '-x-mtfrom-' in locale

    @hybrid_property
    def is_machine_translated(self):
        return self.locale_is_machine_translated(self.locale)

    @is_machine_translated.expression
    def is_machine_translated(cls):
        return cls.locale.like("%-x-mtfrom-%")

    @property
    def machine_translated_from(self):
        l = self.locale.split('-x-mtfrom-', 1)
        if len(l) == 2:
            return l[1]

    @property
    def source_locale(self):
        return self.extract_base_locale(self.locale)

    @staticmethod
    def extract_source_locale(locale):
        return locale.split('-x-mtfrom-', 1)[0]

    @staticmethod
    def extract_base_locale(locale):
        return locale.split('-x-mtfrom-', 1)[0].split('_')[0]

    @property
    def base_locale(self):
        return self.extract_source_locale(self.locale)

    @classproperty
    def locale_collection(cls):
        "A collection of all known locales, as a dictionary of strings->id"
        if cls._locale_collection is None:
            cls._locale_collection = dict(
                cls.default_db.query(cls.locale, cls.id))
        return cls._locale_collection

    @classmethod
    def get_id_of(cls, locale_name):
        return cls.locale_collection.get(locale_name, None)

    @classmethod
    def get_or_create(cls, locale_name):
        locale_id = cls.get_id_of(locale_name)
        if locale_id:
            return Locale.get(locale_id)
        else:
            return Locale(locale=locale_name)

    @classproperty
    def locale_collection_byid(cls):
        "A collection of all known locales, as a dictionary of id->string"
        if cls._locale_collection_byid is None:
            cls._locale_collection_byid = {
                id: name for (name, id) in cls.locale_collection.iteritems()}
        return cls._locale_collection_byid

    @classproperty
    def locale_collection_subsets(cls):
        "A dictionary giving all the know locale variants for a base locale"
        if cls._locale_collection_subsets is None:
            # This is used often enough to be worth caching
            collections = cls.locale_collection
            collection_subsets = defaultdict(set)
            for locale in collections.iterkeys():
                collection_subsets[cls.extract_base_locale(locale)].add(locale)
            cls._locale_collection_subsets = collection_subsets
        return cls._locale_collection_subsets

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


class LocaleName(Base):
    __tablename__ = "locale_name"
    id = Column(Integer, primary_key=True)
    locale_id = Column(
        Integer, ForeignKey(
            Locale.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    target_locale_id = Column(
        Integer, ForeignKey(
            Locale.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    name = Column(CoerceUnicode)

    crud_permissions = CrudPermissions(P_READ, P_ADMIN_DISC)


LocaleName.locale = relationship(Locale, foreign_keys=(
        LocaleName.locale_id,))
LocaleName.target_locale = relationship(Locale, foreign_keys=(
        LocaleName.target_locale_id,))


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
    def create(cls, value, locale=Locale.UNDEFINED):
        ls = cls()
        lse = LangStringEntry(
            langstring=ls, value=value, locale_id=Locale.get_id_of(locale))
        return ls

    entries_as_dict = relationship(
        "LangStringEntry",
        collection_class=attribute_mapped_collection("locale_id"))

    @hybrid_method
    def non_mt_entries(self):
        by_locale_id = Locale.locale_collection_byid
        return [e for e in self.entries
                if not Locale.locale_is_machine_translated(
                    by_locale_id[e.locale_id])]

    @non_mt_entries.expression
    def non_mt_entries(self):
        return self.db.query(LangStringEntry).join(Locale).filter(
            Locale.locale.notlike("%-x-mtfrom-%")).subquery()

    @hybrid_method
    def best_lang(self, locales):
        locale_collection = Locale.locale_collection
        locale_collection_subsets = Locale.locale_collection_subsets
        available = self.entries_as_dict
        if len(available) == 0:
            return LangStringEntry.EMPTY
        if len(available) == 1:
            # optimize for common case
            return available[0]
        for locale in locales:
            # is the locale there?
            locale_id = locale_collection.get(locale, None)
            if locale_id and locale_id in available:
                return available[locale_id]
            # is the base locale there?
            base_locale = Locale.extract_base_locale(locale)
            if base_locale not in locales:
                locale_id = locale_collection.get(base_locale, None)
                if locale_id and locale_id in available:
                    return available[locale_id]
            # is another variant there?
            mt_variants = list()
            for sublocale in locale_collection_subsets[base_locale]:
                if sublocale in locales:
                    continue
                if sublocale == base_locale:
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

    @best_lang.expression
    def best_lang(self, locales):
        # Construct an expression that will find the best locale according to list.
        scores = {}
        current_score = 1
        locale_collection = Locale.locale_collection
        locale_collection_subsets = Locale.locale_collection_subsets
        for locale in locales:
            # is the locale there?
            locale_id = locale_collection.get(locale, None)
            if locale_id:
                scores[locale_id] = current_score
                current_score += 1
            # is the base locale there?
            base_locale = Locale.extract_base_locale(locale)
            if base_locale not in locales:
                locale_id = locale_collection.get(base_locale, None)
                if locale_id:
                    scores[locale_id] = current_score
                    current_score += 1
            # is another variant there?
            mt_variants = list()
            found = False
            for sublocale in locale_collection_subsets[base_locale]:
                if sublocale in locales:
                    continue
                if sublocale == base_locale:
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
        if "langstring_id" not in kwargs and "langstring" not in kwargs:
            kwargs["langstring"] = LangString()
        if "locale_id" not in kwargs and "locale" not in kwargs:
            # Create locale on demand.
            locale_code = kwargs.get("@language", "und")
            locale_id = Locale.locale_collection.get(locale_code, None)
            if locale_id is None:
                kwargs["locale"] = Locale(locale=locale_code)
            else:
                kwargs["locale_id"] = locale_id
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
    locale_confirmed = Column(Boolean, server_default="0",
        doc="Locale inferred from discussion agrees with identification_data")
    # tombstone_date = Column(DateTime) implicit from Tombstonable mixin
    value = Column(UnicodeText)  # not searchable inv virtuoso

    def __repr__(self):
        value = self.value or ''
        if len(value) > 50:
            value = value[:50]+'...'
        return '%d: [%s] "%s"' % (
            self.id or -1, self.locale.locale, value.encode('utf-8'))

    @property
    def locale_name(self):
        return Locale.locale_collection_byid.get(self.locale_id, None)
        # Equivalent to the following, which may trigger a DB load
        # return self.locale.locale

    @locale_name.setter
    def locale_name(self, locale_name):
        locale_id = Locale.locale_collection.get(locale_name, None)
        if locale_id:
            self.locale_id = locale_id
        else:
            self.locale = Locale(locale=locale_name)

    def change_value(self, new_value):
        self.tombstone = datetime.utcnow()
        new_version = self.__class__(
            langstring_id=self.langstring_id,
            locale_id=self.locale_id,
            value=new_value)
        self.db.add(new_version)
        return new_version

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


def includeme(config):
    LangString.EMPTY = LangString()
    LangStringEntry.EMPTY = LangStringEntry(
        value="", locale_id=0, langstring=LangString.EMPTY)
    # need to find a way to delay the following until connection established:
    # LangStringEntry.EMPTY.locale_id = Locale.NON_LINGUISTIC_LOCALEID
