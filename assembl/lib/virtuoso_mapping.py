from os import listdir
from os.path import join, dirname
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from rdflib import Graph

from .sqla import class_registry
from ..namespaces import (
    namespace_manager as nsm, ASSEMBL, QUADNAMES, RDF, OWL)
from virtuoso.vmapping import (
    PatternIriClass, LiteralQuadMapPattern, ClassQuadMapPattern,
    GraphQuadMapPattern, QuadStorage)
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


def create_graphs(session):
    for stmt in iri_function_definition_stmts:
        session.execute(stmt)
    class_patterns = []
    for cls in class_registry.itervalues():
        if not getattr(cls, 'class_quad_pattern', None):
            continue
        p = cls.class_quad_pattern(nsm)
        if p:
            class_patterns.append(p)
    # TODO: one per discussion.
    gqm = [
        GraphQuadMapPattern(
            cp.sqla_cls.class_graph_name(),
            cp.sqla_cls.class_graph_pattern_name(), nsm, None, cp)
        for cp in class_patterns]
    qs = QuadStorage(
        ASSEMBL.discussion_storage, gqm, None, False, nsm)
    defn = qs.definition_statement(nsm, session.bind)
    list(session.execute('sparql '+defn))
    # store = Virtuoso(connection=session.bind.connect(), quad_storage=qs.name)
    # triples = list(store.triples((None, None, None)))
