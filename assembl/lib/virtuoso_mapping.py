from os import listdir
from os.path import join, dirname
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from rdflib import Graph

from .sqla import class_registry
from ..namespaces import (
    namespace_manager as nsm, ASSEMBL, QUADNAMES, RDF, OWL)
from virtuoso.vmapping import (
    PatternIriClass, QuadMapPattern, ClassPatternExtractor,
    GraphQuadMapPattern, QuadStorage, ClassAliasManager)
from virtuoso.vstore import Virtuoso


def get_session():
    admin_engine = create_engine('virtuoso://dba:dba@VOSU')
    SessionMaker = sessionmaker(admin_engine)
    return SessionMaker()

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
    ''']


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


class AssemblClassPatternExtractor(ClassPatternExtractor):

    def extract_subject_pattern(self, cls):
        iri_qmp = None
        try:
            iri_qmp = cls.iri_class()
        except AttributeError:
            pass
        if iri_qmp:
            return iri_qmp.apply(cls.id)
        return super(AssemblClassPatternExtractor, self
                    ).extract_subject_pattern(cls)

    def class_pattern_name(self, cls):
        clsname = cls.external_typename()
        return getattr(QUADNAMES, 'class_pattern_'+clsname)

    def make_column_name(self, cls, column):
        clsname = cls.external_typename()
        return getattr(QUADNAMES, 'col_pattern_%s_%s' % (
            clsname, column.name))

    def extract_column_info(self, sqla_cls, subject_pattern):
        rdf_class = sqla_cls.__dict__.get('rdf_class', None)
        if rdf_class:
            yield QuadMapPattern(
                subject_pattern, RDF.type, rdf_class, self.graph,
                self.class_pattern_name(sqla_cls), self.storage)
        for p in super(AssemblClassPatternExtractor, self).extract_column_info(
                sqla_cls, subject_pattern):
            yield p
        for p in sqla_cls.special_quad_patterns(self.alias_manager):
            yield p


# LEGACY. Needs to be rewritten.
# class AssemblClassVariantPatternExtractor(AssemblClassPatternExtractor):
#     def __init__(self, entityname, graph=None, storage=None):
#         super(AssemblClassVariantPatternExtractor, self
#              ).__init__(graph=None, storage=None)
#         self.entityname = entityname

#     def make_iri_class(self, cls):
#         id_column = getattr(cls, 'id', None)
#         if id_column is None:
#             return None
#         clsname = cls.external_typename_with_inheritance() + '_' + self.entityname
#         iri_name = clsname + "_iri"
#         return PatternIriClass(
#             getattr(QUADNAMES, iri_name),
#             '^{DynamicLocalFormat}^/'+clsname+'/%d', ('id', Integer, False))

#     def class_pattern_name(self, cls):
#         clsname = cls.external_typename() + '_' + self.entityname
#         return getattr(QUADNAMES, 'class_pattern_'+clsname)

#     def make_column_name(cls, column):
#         clsname = cls.external_typename() + '_' + self.entityname
#         return getattr(QUADNAMES, 'col_pattern_%s_%s' % (
#             clsname, column.name))

#     This especially needs to be rewritten
#     def extract_info(self, sqla_cls, subject_pattern=None):
#         mapper = cls.__mapper__
#         info = getattr(mapper.mapped_table, 'info', {})
#         entitynames = cls.rdf_entitynames()
#         assert isinstance(entitynames, list)
#         subject_patterns = {entityname: cls.subject_quad_pattern(entityname) for entityname in entitynames}
#         for entityname, subject_pattern in subject_patterns.items():
#             patterns = cls.special_quad_patterns(entityname)
#             # only direct, not inherited
#             rdf_class = cls.__dict__.get('rdf_class', None)
#             if rdf_class:
#                 assert isinstance(rdf_class, dict)
#                 rdf_class = rdf_class[entityname]
#                 patterns.append(RdfClassQuadMapPattern(
#                     rdf_class, None, cls.class_type_pattern_name(entityname)))
#             for c in mapper.columns:
#                 if c.table != mapper.local_table:
#                     continue
#                 if 'rdf' in c.info:
#                     qmp = c.info['rdf']
#                     assert isinstance(qmp, tuple)
#                     qmp, entitynames = qmp
#                     if entityname not in entitynames:
#                         continue
#                     qmp.set_columns(c)
#                     if not qmp.name:
#                         qmp.name = cls.column_pattern_name(c)
#                     patterns.append(qmp)
#             if not len(patterns):
#                 return
#             for p in patterns:
#                 assert p.name
#             yield ClassQuadMapPattern(
#                 cls, subject_pattern, cls.class_pattern_name(),
#                 *patterns)


def get_quadstorage(session):
    alias_manager = ClassAliasManager()
    gqm = GraphQuadMapPattern(QUADNAMES.main_graph, QUADNAMES.main_graph_iri, None)
    qs = QuadStorage(ASSEMBL.discussion_storage, [gqm])
    cpe = AssemblClassPatternExtractor(alias_manager, gqm.name, qs.name)
    # TODO: one per discussion.
    for cls in class_registry.itervalues():
        gqm.add_patterns(cpe.extract_info(cls))
    return qs, alias_manager


def create_graphs(session):
    for stmt in iri_function_definition_stmts:
        session.execute(stmt)
    qs, alias_manager = get_quadstorage(session)
    defn = qs.definition_statement(nsm, alias_manager, session.bind)
    list(session.execute('sparql '+defn))
    # store = Virtuoso(connection=session.bind.connect(), quad_storage=qs.name)
    # triples = list(store.triples((None, None, None)))
