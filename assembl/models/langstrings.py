from collections import defaultdict
from datetime import datetime

from sqlalchemy import (
    Column, ForeignKey, Integer, Boolean, String, DateTime,
    UnicodeText, UniqueConstraint, event)
from sqlalchemy.sql.expression import case
from sqlalchemy.orm import (
    relationship, backref, subqueryload, joinedload, aliased)
from sqlalchemy.orm.query import Query
from sqlalchemy.orm.collections import attribute_mapped_collection
from sqlalchemy.ext.hybrid import hybrid_method
from virtuoso.alchemy import CoerceUnicode

from . import Base, TombstonableMixin, User


class classproperty(object):
    def __init__(self, f):
        self.f = f

    def __get__(self, obj, owner):
        return self.f(owner)


class Locale(Base):
    __tablename__ = "locale"
    id = Column(Integer, primary_key=True)
    locale = Column(String(20), unique=True)
    _locale_collection = None
    _locale_collection_subsets = None

    @staticmethod
    def locale_is_machine_translated(locale):
        return '-x-mtfrom-' in locale

    @property
    def is_machine_translated(self):
        return self.locale_is_machine_translated(self.locale)

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
        # TODO: Clear both collections when locale is created or destroyed
        if cls._locale_collection is None:
            cls._locale_collection = dict(
                cls.default_db.query(cls.locale, cls.id))
        return cls._locale_collection

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


@event.listens_for(Locale, 'after_insert', propagate=True)
@event.listens_for(Locale, 'after_delete', propagate=True)
def locale_collection_changed(target, value, oldvalue, initiator):
    # Reset the collections
    Locale._locale_collection_subsets = None
    Locale._locale_collection = None


class LocaleName(Base):
    __tablename__ = "locale_name"
    id = Column(Integer, primary_key=True)
    locale_id = Column(
        Integer, ForeignKey(
            Locale.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    locale = relationship(Locale, foreign_keys=(
        "locale_name.locale_id",))
    target_locale_id = Column(
        Integer, ForeignKey(
            Locale.id, ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False)
    target_locale = relationship(Locale, foreign_keys=(
        "locale_name.target_locale_id",))
    name = Column(CoerceUnicode)


class LangString(Base):
    __tablename__ = "langstring"
    id = Column(Integer, primary_key=True)

    @classmethod
    def subqueryload_option(cls, reln):
        return subqueryload(reln, cls.entries_as_dict)

    @classmethod
    def joinedload_option(cls, reln):
        return joinedload(reln, cls.entries_as_dict)

    entries_as_dict = relationship(
        "LangStringEntry",
        collection_class=attribute_mapped_collection("locale_id"))

    @hybrid_method
    def best_lang(self, locales):
        locale_collection = Locale.locale_collection
        locale_collection_subsets = Locale.locale_collection_subsets
        available = self.entries_as_dict
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
            locale_code = kwargs.get("locale_code", None)
            # Should we allow locale-less LangStringEntry? (for unknown...)
            assert locale_code, "You need to specify a locale"
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

    def change_value(self, new_value):
        self.tombstone = datetime.utcnow()
        new_version = self.__class__(
            langstring_id=self.langstring_id,
            locale_id=self.locale_id,
            value=new_value)
        self.db.add(new_version)
        return new_version


# class TranslationStamp(Base):
#     "For future reference. Not yet created."
#     __tablename__ = "translation_stamp"
#     id = Column(Integer, primary_key=True)
#     source = Column(Integer, ForeignKey(LangStringEntry.id))
#     dest = Column(Integer, ForeignKey(LangStringEntry.id))
#     translator = Column(Integer, ForeignKey(User.id))
#     created = Column(DateTime, server_default="now()")


class PostTest(Base):
    __tablename__ = "post_test"
    id = Column(Integer, primary_key=True)
    title_id = Column(Integer, ForeignKey(LangString.id))
    body_id = Column(Integer, ForeignKey(LangString.id))
    title = relationship(
        LangString,
        primaryjoin=title_id == LangString.id)
    body = relationship(
        LangString,
        primaryjoin=body_id == LangString.id)

    @classmethod
    def subqueryload_options(cls):
        # Options for subquery loading. Use when there are many languages in the discussion.
        return (
            LangString.subqueryload_option(cls.title),
            LangString.subqueryload_option(cls.body))

    @classmethod
    def joinedload_options(cls):
        # Options for joined loading. Use when there are few languages in the discussion.
        return (
            LangString.joinedload_option(cls.title),
            LangString.joinedload_option(cls.body))

    @classmethod
    def best_locale_query(cls, locales):
        "BUGGY. Return a query that will load the post, best title and best body for the given locales"
        # this fails because virtuoso, but the SQL is correct.
        # Note that it fails with just body, and succeeds with title.
        # Go figure. Fortunately not needed yet.
        title_ls = aliased(LangString)
        body_ls = aliased(LangString)
        best_title_sq = LangString.best_lang(locales)
        best_body_sq = LangString.best_lang(locales)

        return cls.default_db.query(
            cls, best_title_sq, best_body_sq).join(
            title_ls, PostTest.title_id == title_ls.id).join(
            best_title_sq).join(
            body_ls, PostTest.body_id == body_ls.id).join(best_body_sq)


if __name__ == '__main__':
    # Test fixtures
    db = None
    fr_l = Locale(locale='fr')
    en_l = Locale(locale='en')
    de_l = Locale(locale='de')
    ls1 = LangString(id=1)
    ls2 = LangString(id=2)
    db.add_all((fr_l, en_l, de_l, ls1, ls2))
    db.commit()
    db.add(LangStringEntry(langstring=ls1, locale=fr_l, value="Bonjour"))
    db.add(LangStringEntry(langstring=ls1, locale=en_l, value="Hello"))
    db.add(LangStringEntry(langstring=ls1, locale=de_l, value="Guten Tag"))
    db.add(LangStringEntry(langstring=ls2, locale=fr_l, value="Monde"))
    db.add(LangStringEntry(langstring=ls2, locale=en_l, value="World"))
    db.add(LangStringEntry(langstring=ls2, locale=de_l, value="Welt"))
    db.add(PostTest(title=ls1, body=ls2))
    # ps=db.query(PostTest).options(*PostTest.subqueryload_options()).all()
