import re

import requests
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Unicode,
    Float,
    Boolean,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.sql.functions import coalesce
from sqlalchemy.sql.expression import case
# from sqlalchemy.sql import func

from . import Base, DiscussionBoundBase
from .generic import Content
from .langstrings import Locale, LangString, LangStringEntry
from ..lib.logging import getLogger
from .computation import Computation


log = getLogger('assembl')
sameAs = "http://www.w3.org/2002/07/owl#sameAs"


class LocalizedUriConcept(Base):
    __tablename__ = "localized_concept"
    id = Column(Integer, primary_key=True)
    type = Column(String(20), nullable=False)
    concept_uri = Column(Unicode, index=True)
    locale_id = Column(Integer, ForeignKey(Locale.id, ondelete="SET NULL"))
    english_id = Column(Integer, ForeignKey(
        id, ondelete="SET NULL"))
    locale = relationship(Locale)
    english_concept = relationship(
        "LocalizedUriConcept",
        remote_side=[id],
        backref="translations")
    __table_args__ = (UniqueConstraint(concept_uri, locale_id), )
    __mapper_args__ = {
        'polymorphic_identity': 'abstract',
        'polymorphic_on': type,
        'with_polymorphic': '*'
    }

    @hybrid_property
    def english_id_calc(self):
        return self.english_id if self.english_id else self.id

    @english_id_calc.expression
    def english_id_calc(self):
        return coalesce(self.english_id, self.id)

    @classmethod
    def get_or_create(cls, concept_uri, db=None):
        db = db or cls.default_db
        concept = db.query(cls).filter_by(concept_uri=concept_uri).first()
        if not concept:
            concept = cls(concept_uri=concept_uri)
            db.add(concept)
            concept.setup(db)
        return concept

    def setup(self, db=None):
        pass


class DBPediaConcept(LocalizedUriConcept):
    _rel_re = re.compile(r'http://([-\w]+\.)?dbpedia.org/resource/(.*)')

    __mapper_args__ = {
        'polymorphic_identity': 'dbpedia',
    }

    def setup(self, db=None):
        self.identify_english(db)

    @property
    def wiki_url(self):
        match = self._rel_re.match(self.concept_uri)
        if match:
            match = match.groups()
            lang = (match[0] or 'en').rstrip('.')
            return u"http://%s.wikipedia.org/wiki/%s" % (lang, match[1])

    @property
    def dbpedia_url(self):
        return '/page/'.join(self.concept_uri.split('/resource/'))

    @property
    def concept_label(self):
        match = self._rel_re.match(self.concept_uri)
        if match:
            label = match.group(2)
            return ' '.join(label.split('_'))

    def identify_locale(self, db=None):
        db = db or self.db
        if not self.locale:
            match = self._rel_re.match(self.concept_uri)
            assert match
            if match:
                lang = (match.group(1) or 'en').rstrip('.')
                self.locale = Locale.get_or_create(lang, db)
        return self.locale

    def identify_english(self, db=None):
        db = db or self.db
        locale = self.identify_locale()
        if locale.code == 'en':
            return self
        elif not self.english_concept:
            sparql = u"SELECT ?s WHERE {?s <%s> <%s>}" % (sameAs, self.concept_uri)
            result = requests.get('http://dbpedia.org/sparql', params={
                'query': sparql,
                'output': 'text/csv'})
            if not result.ok:
                return False
            results = [x.strip('"') for x in result.content.split()[1:]]
            if not len(results):
                return False
            if len(results) > 1:
                log.warning("multiple results in dbpedia:" + str(result))
            result = results[0]
            result = result.decode('utf-8')
            concept = db.query(DBPediaConcept
                               ).filter_by(concept_uri=result).first()
            if not concept:
                concept = DBPediaConcept(
                    concept_uri=result, locale=Locale.get_or_create('en', db))
                db.add(concept)
            self.english_concept = concept
        return self.english_concept

    def identify_languages(self, languages, db=None):
        db = db or self.db
        if not languages:
            return []
        locale = self.identify_locale()
        if locale.code != 'en':
            english = self.identify_english(db)
            db.flush()
            return english.identify_languages(languages, db)
        existing = db.query(DBPediaConcept).filter_by(english_id=self.id).all()
        existing.append(self)
        existing_locales = {c.locale.code for c in existing}
        missing_locales = set(languages) - existing_locales
        concepts = [c for c in existing if c.locale.code in languages]
        if not missing_locales:
            return concepts
        sparql = u"SELECT ?o WHERE {<%s> <%s> ?o}" % (self.concept_uri, sameAs)
        result = requests.get('http://dbpedia.org/sparql', params={
            'query': sparql,
            'output': 'text/csv'})
        if not result.ok:
            return False
        results = [x.strip('"') for x in result.content.split()[1:]]
        for result in results:
            match = self._rel_re.match(result)
            if not match:
                continue
            locale = match.group(1)
            if not locale:
                continue
            locale = locale.rstrip('.')
            if locale not in missing_locales:
                continue
            concept = DBPediaConcept(
                concept_uri=result.decode('utf-8'),
                locale=Locale.get_or_create(locale, db), english_concept=self)
            db.add(concept)
            concepts.append(concept)
            missing_locales.remove(locale)
        db.flush()
        return concepts


class Tag(Base):
    __tablename__ = 'tag'
    id = Column(Integer, primary_key=True)
    locale_id = Column(Integer, ForeignKey(Locale.id))
    label_id = Column(Integer, ForeignKey(LangString.id))
    base_tag_id = Column(Integer, ForeignKey("tag.id"))

    @hybrid_property
    def group_id(self):
        return self.base_tag_id or self.id

    @group_id.expression
    def group_id(cls):
        return coalesce(cls.base_tag_id, cls.id)

    # violates DRY, but allows for faster queries.
    locale = relationship(Locale)  # corresponds to original lang of label.
    label = relationship(
        LangString, backref=backref("label_of_tag", lazy="dynamic"))
    equivalent_tags = relationship(
        "Tag",
        foreign_keys=[base_tag_id],
        backref=backref('reference_tag', remote_side=[id]),
    )
    label_string_entry = relationship(
        LangStringEntry, viewonly=True, lazy='select',
        primaryjoin=(LangStringEntry.locale_id == locale_id) &
        (LangStringEntry.langstring_id == label_id),
        foreign_keys=[label_id, locale_id],
        remote_side=[LangStringEntry.langstring_id, LangStringEntry.locale_id])

    @classmethod
    def getOrCreateTag(cls, label, locale, db=None):
        db = db or cls.default_db
        tag = db.query(cls).filter(
            cls.locale == locale).join(
            cls.label_string_entry).filter(
            LangStringEntry.value == label).first()
        if not tag:
            ls = LangString.create(label, locale.code)
            tag = cls(locale=locale, label=ls)
            db.add(tag)
        return tag

    @property
    def original_label(self):
        return self.label_string_entry.value

    @property
    def reference_label(self):
        # Note: by simplistic_unify, the reference_label will be identical
        # to the translated label. Maybe use the latter.
        tag = self.reference_tag if self.base_tag_id else self
        return tag.label_string_entry.value

    def simplistic_unify(self, translator):
        if self.locale.code == 'en':
            return
        target = Locale.get_or_create('en')
        en_translation = translator.translate_lse(
            self.label_string_entry, target)
        if en_translation:
            self.reference_tag = self.getOrCreateTag(
                en_translation.value, target)


LangString.setup_ownership_load_event(Tag, ['label'])


class PostKeywordAnalysisMixin(object):
    id = Column(Integer, primary_key=True)
    score = Column(Float)

    @declared_attr
    def post_id(self):
        return Column(Integer, ForeignKey(Content.id, ondelete="CASCADE"))

    @declared_attr
    def source_id(self):
        return Column(Integer, ForeignKey(
            Computation.id, ondelete="CASCADE"))

    @declared_attr
    def post(self):
        return relationship(Content)

    @declared_attr
    def source(self):
        return relationship(Computation)

    def get_discussion_id(self):
        post = self.post or Content.get(self.post_id)
        return post.get_discussion_id()

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        if alias_maker is None:
            pkwa = cls
            post = Content
        else:
            pkwa = alias_maker.alias_from_class(cls)
            post = alias_maker.alias_from_relns(pkwa.post)
        return ((pkwa.source_id == post.id),
                (post.discussion_id == discussion_id))


class PostKeywordAnalysis(PostKeywordAnalysisMixin, DiscussionBoundBase):
    __tablename__ = "post_keyword_analysis"
    value = Column(Unicode, index=True)
    tag_id = Column(Integer, ForeignKey(
        Tag.id, ondelete="CASCADE"))
    value = relationship(Tag)
    category = Column(Boolean)
    # db.query(PostKeywordAnalysis.value, func.sum(PostKeywordAnalysis.score)
    #         ).filter_by(category=None
    #         ).group_by(PostKeywordAnalysis.value
    #         ).order_by(func.sum(PostKeywordAnalysis.score).desc()
    #         ).limit(30).all()


class PostDBPediaConceptAnalysis(
        PostKeywordAnalysisMixin, DiscussionBoundBase):
    __tablename__ = "post_dbpediaconcept_analysis"
    concept_id = Column(Integer, ForeignKey(
        LocalizedUriConcept.id, ondelete="CASCADE"))
    value = relationship(LocalizedUriConcept)
    # q=db.query(func.sum(PostDBPediaConceptAnalysis.score).label('score'),
    #                     DBPediaConcept.english_id_calc.label('id')
    #            ).join(DBPediaConcept
    #            ).group_by(DBPediaConcept.english_id_calc
    #            ).order_by(func.sum(PostDBPediaConceptAnalysis.score).desc()
    #            ).limit(30).subquery()
    # db.query(DBPediaConcept.concept_uri, q.c.score
    #          ).join(q, DBPediaConcept.id==q.columns.id).all()


class PostWatsonV1SentimentAnalysis(Base):
    __tablename__ = "post_watsonv1_sentiments"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey(
        Content.id, ondelete="CASCADE"))
    source_id = Column(Integer, ForeignKey(
        Computation.id, ondelete="CASCADE"))
    text_length = Column(Integer)
    sentiment = Column(Float)
    anger = Column(Float)
    disgust = Column(Float)
    fear = Column(Float)
    joy = Column(Float)
    sadness = Column(Float)
    __table_args__ = (UniqueConstraint(source_id, post_id), )
    post = relationship(Content)
    source = relationship(Computation)

    @hybrid_property
    def positive_sentiment(self):
        return max(0.0, self.sentiment)

    @positive_sentiment.expression
    def positive_sentiment(self):
        return case([
            (self.sentiment >= 0, self.sentiment)], else_=0)

    @hybrid_property
    def negative_sentiment(self):
        return min(0.0, self.sentiment)

    @negative_sentiment.expression
    def negative_sentiment(self):
        return case([
            (self.sentiment < 0, self.sentiment)], else_=0)
