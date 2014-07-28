from os import listdir
from os.path import join, dirname
from itertools import ifilter

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from rdflib import Graph, ConjunctiveGraph
import simplejson as json

from ..lib.sqla import class_registry, Base
from .namespaces import (
    namespace_manager as _nsm, ASSEMBL, QUADNAMES, RDF, OWL, CATALYST)
from virtuoso.vmapping import (
    PatternIriClass, QuadMapPattern, ClassPatternExtractor,
    GraphQuadMapPattern, QuadStorage, ClassAliasManager,
    PatternGraphQuadMapPattern)
from virtuoso.vstore import Virtuoso


def get_session():
    admin_engine = create_engine('virtuoso://dba:dba@VOSU')
    SessionMaker = sessionmaker(admin_engine)
    return SessionMaker()


def get_nsm(session):
    from .namespaces import namespace_manager
    from virtuoso.vstore import VirtuosoNamespaceManager
    nsm = VirtuosoNamespaceManager(Graph(), session)
    for prefix, namespace in namespace_manager.namespaces():
        nsm.bind_virtuoso(session, prefix, namespace)
    return nsm


def get_virtuoso(session, storage=ASSEMBL.discussion_storage):
    v = Virtuoso(quad_storage=storage,
                 connection=session.connection())
    return v

USER_SECTION = 'user'
MAIN_SECTION = 'main'
EXTRACT_SECTION = 'extract'
DISCUSSION_DATA_SECTION = 'data'
DISCUSSION_HISTORY_SECTION = 'history'
DISCUSSION_PSEUDONYMS_SECTION = 'pseudonyms'

formats = dict(
    ttl='turtle',
    owl='xml',
    xml='xml',
    trig='trig'
)

iri_function_definition_stmts = [
    '''CREATE FUNCTION DB.DBA._ID_TO_IRI (in id IRI_ID)
    returns IRI
    {
        return id_to_iri(id);
    }''',
    '''CREATE FUNCTION DB.DBA._ID_TO_IRI_INVERSE (in id_iri IRI)
    returns IRI_ID
    {
        return iri_to_id(id_iri);
    }''',
    '''SPARQL
    create iri class virtrdf:iri_id using
      function DB.DBA._ID_TO_IRI (in id varchar)
        returns varchar,
      function DB.DBA._ID_TO_IRI_INVERSE (in id_iri varchar)
        returns varchar
    ''',
    """CREATE FUNCTION DB.DBA._EXPAND_QNAME (in qname varchar)
    returns IRI
    {
        declare exit handler for sqlstate '22023' {
            return qname;
        };
        return __xml_nsexpand_iristr(qname);
    }""",
    """CREATE FUNCTION DB.DBA._EXPAND_QNAME_INVERSE (in iri IRI)
    returns varchar
    {
        declare prefix, abbrev, local varchar;
        prefix := iri_split(iri, local);
        abbrev := __xml_get_ns_prefix(prefix, 2);
        if (abbrev) {
        return concat(abbrev, ':', local);
        }
        return iri;
    }""",
    """SPARQL create iri class virtrdf:QNAME_ID using
      function DB.DBA._EXPAND_QNAME (in id varchar)
        returns varchar,
      function DB.DBA._EXPAND_QNAME_INVERSE (in id_iri varchar)
        returns varchar
    """
]


def load_ontologies(session, reload=None):
    store = Virtuoso(connection=session.bind.connect())
    known_graphs = [g.identifier for g in store.contexts()]
    print 'known', known_graphs
    ontology_dir = join(dirname(dirname(__file__)), 'ontology')
    for fname in listdir(ontology_dir):
        ending = fname.rsplit('.')[-1]
        if ending not in formats:
            continue
        print fname,
        temp_graph = Graph()
        temp_graph.parse(join(ontology_dir, fname), format=formats[ending])
        ontologies = list(temp_graph.subjects(RDF.type, OWL.Ontology))
        print ontologies,
        if len(ontologies) != 1:
            continue
        ontology = ontologies[0]
        if ontology in known_graphs:
            print 'already there'
            continue
        for (s, p, o) in temp_graph.triples((None, None, None)):
            store.add((s, p, o), context=ontology)
        print "loaded"


class QuadMapPatternS(QuadMapPattern):
    def __init__(
            self, subject=None, predicate=None, obj=None, graph_name=None,
            name=None, condition=None, nsm=None, section=None):
        super(QuadMapPatternS, self).__init__(
            subject, predicate, obj, graph_name, name, condition, nsm)
        self.section = section

    def clone_with_defaults(self, subject=None, obj=None, graph_name=None,
                            name=None, condition=None, section=None):
        qmp = super(QuadMapPatternS, self).clone_with_defaults(
            subject, obj, graph_name, name, condition)
        qmp.section = self.section or section
        return qmp


class AssemblClassPatternExtractor(ClassPatternExtractor):

    def __init__(self, alias_manager, graph=None,
                 section=None, discussion_id=None):
        super(AssemblClassPatternExtractor, self).__init__(
            alias_manager, lambda cls: cls.iri_class(), graph)
        self.section = section
        self.discussion_id = discussion_id

    def class_pattern_name(self, cls):
        clsname = cls.external_typename()
        if self.discussion_id:
            return getattr(QUADNAMES, 'class_pattern_d%s_%s' % (
                self.discussion_id, clsname))
        else:
            return getattr(QUADNAMES, 'class_pattern_'+clsname)

    def make_column_name(self, cls, column):
        clsname = cls.external_typename()
        if self.discussion_id:
            return getattr(QUADNAMES, 'col_pattern_d%s_%s_%s' % (
                self.discussion_id, clsname, column.name))
        else:
            return getattr(QUADNAMES, 'col_pattern_%s_%s' % (
                clsname, column.name))

    def _extract_column_info(self, sqla_cls, subject_pattern):
        rdf_class = sqla_cls.__dict__.get('rdf_class', None)
        rdf_section = sqla_cls.__dict__.get(
            'rdf_section', DISCUSSION_DATA_SECTION)
        if rdf_class:
            yield QuadMapPatternS(
                subject_pattern, RDF.type, rdf_class, self.graph,
                self.class_pattern_name(sqla_cls),
                self.get_base_condition(sqla_cls), None, rdf_section)
        for p in super(AssemblClassPatternExtractor, self).extract_column_info(
                sqla_cls, subject_pattern):
            yield p
        if 'special_quad_patterns' in sqla_cls.__dict__:
            # Only direct definition
            for qmp in sqla_cls.special_quad_patterns(self.alias_manager):
                qmp = self.qmp_with_defaults(qmp, subject_pattern, sqla_cls)
                if qmp.graph_name == self.graph.name:
                    qmp.resolve(sqla_cls)
                    yield qmp

    def get_base_condition(self, cls):
        from ..models import DiscussionBoundBase
        condition = cls.base_condition()
        if self.discussion_id and issubclass(cls, DiscussionBoundBase):
            discussion_condition = cls.get_discussion_condition(self.discussion_id)
            if discussion_condition is not None:
                if condition is None:
                    condition = discussion_condition
                else:
                    condition = condition & discussion_condition
        return condition

    def qmp_with_defaults(self, qmp, subject_pattern, sqla_cls, column=None):
        rdf_section = sqla_cls.__dict__.get(
            'rdf_section', DISCUSSION_DATA_SECTION)
        name = None
        if column is not None:
            name = self.make_column_name(sqla_cls, column)
            if column.foreign_keys:
                column = self.column_as_reference(column)
        qmp = qmp.clone_with_defaults(
            subject_pattern, column, self.graph.name, name, None, rdf_section)
        condition = self.get_base_condition(sqla_cls)
        if condition is not None:
            qmp.and_condition(condition)
        d_id = self.discussion_id
        if (d_id and qmp.name is not None
                and "_d%d_" % (d_id,) not in qmp.name):
            # TODO: improve this
            qmp.name += "_d%d_" % (d_id,)
        return qmp

    def extract_column_info(self, sqla_cls, subject_pattern):
        gen = self._extract_column_info(sqla_cls, subject_pattern)
        if self.section:
            gen = ifilter(lambda q: q.section == self.section, gen)
        return list(gen)


# QUESTION: 1 storage per discussion? I would say yes.
class AssemblQuadStorageManager(object):
    user_quad_storage = QUADNAMES.UserStorage
    user_graph = ASSEMBL.user_graph
    user_graph_iri = QUADNAMES.user_graph_iri
    global_quad_storage = QUADNAMES.global_storage
    global_graph = ASSEMBL.global_graph
    global_graph_iri = QUADNAMES.global_graph_iri
    main_quad_storage = QUADNAMES.main_storage
    main_graph = ASSEMBL.main_graph
    main_graph_iri = QUADNAMES.main_graph_iri

    def __init__(self, nsm):
        self.nsm = nsm
        # Fails if not full schema
        assert Base.metadata.schema.split('.')[1]

    def prepare_storage(self, quad_storage_name, imported=None):
        alias_manager = ClassAliasManager(Base._decl_class_registry)
        return QuadStorage(quad_storage_name, imported, alias_manager, False,
                           nsm=self.nsm)

    def populate_storage(
        self, qs, section, graph_name, graph_iri, discussion_id=None,
            exclusive=True):
        gqm = GraphQuadMapPattern(
            graph_name, qs, graph_iri, 'exclusive' if exclusive else None)
        cpe = AssemblClassPatternExtractor(
            qs.alias_manager, gqm, section, discussion_id)
        for cls in class_registry.itervalues():
            # TODO: Take pattern's graph into account!
            gqm.add_patterns(cpe.extract_info(cls))
        return gqm

    def create_storage(self, session, quad_storage_name,
                       sections, discussion_id=None, exclusive=True,
                       imported=None):
        qs = self.prepare_storage(quad_storage_name, imported or [])
        for section, graph_name, graph_iri, disc_id in sections:
            self.populate_storage(
                qs, section, graph_name, graph_iri, disc_id, exclusive)
        defn = qs.full_declaration_clause()
        return qs, list(session.execute(defn))

    def update_storage(
            self, session, quad_storage_name, sections, exclusive=True):
        qs = self.prepare_storage(quad_storage_name)
        results = []
        for section, graph_name, graph_iri, disc_id in sections:
            gqm = self.populate_storage(
                qs, section, graph_name, graph_iri, disc_id)
            defn = qs.alter_clause_add_graph(gqm)
            results.extend(session.execute(defn))
        return qs, results

    def drop_storage(self, session, storage_name, force=False):
        qs = QuadStorage(storage_name, nsm=self.nsm)
        try:
            qs.drop(session, force)
        except:
            pass

    def drop_graph(self, session, graph_iri, force=False):
        gr = GraphQuadMapPattern(graph_iri, None, nsm=self.nsm)
        gr.drop(session, force)

    def discussion_storage_name(self, discussion_id):
        return getattr(QUADNAMES, 'discussion_%d_storage' % discussion_id)

    def discussion_graph_name(
            self, discussion_id, section=DISCUSSION_DATA_SECTION):
        return getattr(ASSEMBL, 'discussion_%d_%s' % (discussion_id, section))

    def discussion_graph_iri(
            self, discussion_id, section=DISCUSSION_DATA_SECTION):
        return getattr(QUADNAMES, 'discussion_%d_%s_iri' % (
            discussion_id, section))

    def create_main_storage(self, session):
        return self.create_storage(session, self.main_quad_storage, [
            (MAIN_SECTION, self.main_graph, self.main_graph_iri, None)])

    def create_discussion_storage(self, session, discussion):
        id = discussion.id
        qs = self.prepare_storage(self.discussion_storage_name(id))
        for s in (DISCUSSION_DATA_SECTION, ):  # DISCUSSION_HISTORY_SECTION
            self.populate_storage(qs, s, self.discussion_graph_name(id, s),
                                  self.discussion_graph_iri(id, s), id)
        from ..models import Extract, IdeaContentLink, TextFragmentIdentifier
        # Option 1: explicit graphs.
        # Fails because the extract.id in the condition is not part of
        # the compile, so we do not get explicit conditions.
        #
        # for extract in session.query(Extract).filter(
        #         (Extract.discussion==discussion) & (Extract.idea != None)):
        #     gqm = GraphQuadMapPattern(
        #         extract.extract_graph_name(), qs,
        #         extract.extract_graph_iri())
        #     qmp = QuadMapPatternS(
        #         extract.extract_graph_name(), CATALYST.expressesIdea,
        #         IdeaContentLink.iri_class().apply(Extract.idea_id),
        #         graph_name=gqm.name,
        #         name=getattr(QUADNAMES, 'catalyst_expressesIdea_'+str(
        #                      extract.id)),
        #         condition=(Extract.idea_id != None
        #                   ) & (Extract.id == extract.id),
        #         section=EXTRACT_SECTION)
        #     gqm.add_patterns((qmp,))
        #
        # Option 2: use the usual mechanism. But interaction with alias_set is
        # hopelessly complicated
        # self.populate_storage(qs, EXTRACT_SECTION,
        #     Extract.graph_iri_class.apply(Extract.id),
        #     QUADNAMES.ExtractGraph_iri, id)
        #
        # So option 3: A lot of encapsulation breaks...
        # Which still does not quite work in practice, but it does in theory.
        # Sigh.
        qs2 = qs  # self.prepare_storage(self.discussion_storage_name(id))
        extract_graph_name = Extract.graph_iri_class.apply(Extract.id)
        gqm = PatternGraphQuadMapPattern(
            extract_graph_name, qs2, None,
            getattr(QUADNAMES, "catalyst_ExtractGraph_d%d_iri" % (id,)),
            'exclusive')
        qmp = QuadMapPatternS(
            TextFragmentIdentifier.iri_class().apply(
                TextFragmentIdentifier.id),
            CATALYST.expressesIdea,
            IdeaContentLink.iri_class().apply(Extract.idea_id),
            graph_name=extract_graph_name,
            name=getattr(QUADNAMES, "catalyst_expressesIdea_d%d_iri" % (id,)),
            condition=((TextFragmentIdentifier.extract_id == Extract.id)
                       & (Extract.idea_id != None)),
            section=EXTRACT_SECTION)
        gqm.add_patterns((qmp,))
        defn = qs.full_declaration_clause()
        # After all these efforts, sparql seems to reject binding arguments!
        print defn.compile(session.bind)
        result = list(session.execute(defn))
        # defn2 = qs.alter_clause_add_graph(gqm)
        # result.extend(session.execute(str(defn2.compile(session.bind))))
        return qs, defn, result

    def drop_discussion_storage(self, session, discussion, force=False):
        self.drop_storage(
            session, self.discussion_storage_name(discussion.id), force)

    def create_user_storage(self, session):
        return self.create_storage(session, self.user_quad_storage, [
            (USER_SECTION, self.user_graph, self.user_graph_iri, None)])

    def create_extract_graph(self, session, extract):
        discussion_id = extract.get_discussion_id()
        return self.update_storage(session, self.discussion_storage(id), [
            (EXTRACT_SECTION, extract.extract_graph_name(),
                extract.extract_graph_iri(), discussion_id)])

    def drop_extract_graph(self, session, extract, force=False):
        # why do I not need the discussion here?
        self.drop_graph(session, self.extract_iri(extract.id), force)

    def create_private_global_storage(self, session):
        return self.create_storage(session, self.global_quad_storage, [
            (None, self.global_graph, self.global_graph_iri, None)])

    def drop_private_global_storage(self, session, force=False):
        return self.drop_storage(session, self.global_quad_storage, force)

    def declare_functions(self, session):
        for stmt in iri_function_definition_stmts:
            session.execute(stmt)

    def drop_all(self, session, force=False):
        self.drop_storage(session, self.global_quad_storage, force)
        self.drop_storage(session, self.main_quad_storage, force)
        self.drop_storage(session, self.user_quad_storage, force)
        from ..models import Discussion
        for (id,) in session.query(Discussion.id).all():
            self.drop_storage(session, self.discussion_storage_name(id), force)


def db_dump(session, discussion_id):
    nsm = get_nsm(session)
    aqsm = AssemblQuadStorageManager(nsm)
    d_storage_name = aqsm.discussion_storage_name(discussion_id)
    v = get_virtuoso(session, d_storage_name)
    cg = ConjunctiveGraph(v, d_storage_name)
    quads = cg.serialize(format='nquads')
    for (g,) in v.query(
            'SELECT ?g where {graph ?g {?s catalyst:expressesIdea ?o}}'):
        ectx = cg.get_context(g)
        for l in ectx.serialize(format='nt').split('\n'):
            l = l.strip()
            if not l:
                continue
            l = l.rstrip('.')
            l += ' ' + g.n3(nsm)
            quads += l + ' .\n'
    from pyld import jsonld
    context = json.load(open(join(dirname(__file__), 'ontology',
                                  'context.jsonld')))
    jsonf = jsonld.from_rdf(quads)
    jsonc = jsonld.compact(jsonf, context)
    jsonc['@context'] = 'http://purl.org/catalyst/jsonld'
    return jsonc
