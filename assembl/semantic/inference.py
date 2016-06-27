#!/usr/bin/python
"""Inference library based on FuXi"""
from os.path import exists

import requests
from rdflib import Graph, URIRef, RDF, ConjunctiveGraph
from FuXi.Horn.HornRules import HornFromN3
from FuXi.Rete.Util import generateTokenSet
from FuXi.Rete.RuleStore import SetupRuleStore
# from FuXi.Rete.Network import ReteNetwork
# from FuXi.Horn import (
#    DATALOG_SAFETY_NONE, DATALOG_SAFETY_STRICT, DATALOG_SAFETY_LOOSE)
# from FuXi.Horn.HornRules import NetworkFromN3, HornFromDL

DEFAULT_ROOT = URIRef('http://purl.org/catalyst/')
LOCAL_ROOT = '/Users/maparent/OpenSource/catalyst_ontology/'

CATALYST_RULES = [
    "rdf-schema.ttl",
    "owl.ttl",
    "dcterms.ttl",
    "foaf.ttl",
    "sioc.ttl",
    "sioc_arg.ttl",
    "swan-sioc.ttl",
    "openannotation.ttl",
    "catalyst_core.ttl",
    "catalyst_aif.ttl",
    "catalyst_ibis.ttl",
    # "catalyst_ibis_extra.ttl",
    "catalyst_idea.ttl",
    # "catalyst_idea_extra.ttl",
    "catalyst_vote.ttl",
    "assembl_core.ttl",
    "version.ttl",
]


class InferenceStore(object):
    def __init__(self, ontology_root=DEFAULT_ROOT):
        self.ontology_root = ontology_root

    def as_file(self, fname):
        uri = self.ontology_root + fname
        if uri.startswith('http'):
            r = requests.get(uri)
            assert r.ok
            return r.content
        elif uri.startswith('/' or uri.startswith('file:')):
            if uri.startswith('file:'):
                uri = uri[5:]
            while uri.startswith('//'):
                uri = uri[1:]
            assert exists(uri)
            return open(uri)
        else:
            raise ValueError

    def add_ontologies(self, rules=CATALYST_RULES):
        for r in rules:
            self.add_ontology(self.as_file(r))
            print r

    def add_ontology(self, source, format='turtle'):
        pass

    def get_inference(self, graph):
        return graph


class FuXiInferenceStore(InferenceStore):
    def __init__(self, ontology_root=DEFAULT_ROOT, use_owl=False):
        super(FuXiInferenceStore, self).__init__(ontology_root)
        (self.rule_store, self.rule_graph, self.network) = SetupRuleStore(
            makeNetwork=True)
        self.use_owl = use_owl
        self.ontology = Graph()
        rulesets = ['rdfs-rules.n3']
        if self.use_owl:
            # Does not work yet
            rulesets.append('owl-rules.n3')
        for ruleset in rulesets:
            for rule in HornFromN3(self.as_file(ruleset)):
                self.network.buildNetworkFromClause(rule)

    def add_ontology(self, source, format='turtle'):
        self.ontology.parse(source, format=format)

    def get_inference(self, graph):
        network = self.network
        network.reset()
        network.feedFactsToAdd(generateTokenSet(self.ontology))
        print "ontology loaded"
        network.feedFactsToAdd(generateTokenSet(graph))
        return network.inferredFacts

if __name__ == '__main__':
    f = FuXiInferenceStore(LOCAL_ROOT)
    f.add_ontologies()
    eg = ConjunctiveGraph()
    eg.parse('/Users/maparent/OpenSource/assembl-feature/personal/d1.rdf')
    cl = f.get_inference(eg)
    print list(cl.triples((None, RDF.type, None)))
