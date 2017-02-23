import SynthesisService from '../../../js/app/services/synthesisService';

const mockApi = [
  {
    "@id":"local:IdeaGraphView/12",
    "@type":"Synthesis",
    "@view":"default",
    conclusion:"Add a conclusion",
    creation_date:"2014-01-20T16:01:29Z",
    idea_links:[],
    ideas:[],
    introduction:"Introduction de la synthèse",
    is_next_synthesis:false,
    published_in_post:"local:Content/2003",
    subject:"Sujet..."
  },
  {
    "@id":"local:IdeaGraphView/58",
    "@type":"Synthesis",
    "@view":"default",
    conclusion:"Merci, c'était génial de faire ce test niveau 1 !",
    creation_date:"2014-06-03T03:13:05Z",
    idea_links:[],
    ideas:[],
    introduction:"Bonjour, voici 2 grandes idées révolutionnaires, issues de nos discussions passionnées",
    is_next_synthesis:true,
    published_in_post:"local:Content/2153",
    subject:"Synthèse au sujet de comment baisser les taxes"
  },
  {
    "@id":"local:IdeaGraphView/329",
    "@type":"Synthesis",
    "@view":"default",
    conclusion:"La phase de divergence",
    creation_date:"2017-02-14T20:15:50.154885Z",
    idea_links:[],
    ideas:[],
    introduction:"Celle qui provient de nos discussions passionnées",
    is_next_synthesis:false,
    published_in_post:"local:Content/48269",
    subject:"phase 2"
  }
];

describe('This test concern synthesis Service', () => {
  it('Should return the model built from API response', () => {
    const expectedResult = {
      publishedSynthesis: [
        {
          "@id":"local:IdeaGraphView/12",
          "@type":"Synthesis",
          "@view":"default",
          conclusion:"Add a conclusion",
          creation_date:"2014-01-20T16:01:29Z",
          idea_links:[],
          ideas:[],
          introduction:"Introduction de la synthèse",
          is_next_synthesis:false,
          published_in_post:"local:Content/2003",
          subject:"Sujet..."
        },
        {
          "@id":"local:IdeaGraphView/329",
          "@type":"Synthesis",
          "@view":"default",
          conclusion:"La phase de divergence",
          creation_date:"2017-02-14T20:15:50.154885Z",
          idea_links:[],
          ideas:[],
          introduction:"Celle qui provient de nos discussions passionnées",
          is_next_synthesis:false,
          published_in_post:"local:Content/48269",
          subject:"phase 2"
        } 
      ],
      draftSynthesis: [
        {
          "@id":"local:IdeaGraphView/58",
          "@type":"Synthesis",
          "@view":"default",
          conclusion:"Merci, c'était génial de faire ce test niveau 1 !",
          creation_date:"2014-06-03T03:13:05Z",
          idea_links:[],
          ideas:[],
          introduction:"Bonjour, voici 2 grandes idées révolutionnaires, issues de nos discussions passionnées",
          is_next_synthesis:true,
          published_in_post:"local:Content/2153",
          subject:"Synthèse au sujet de comment baisser les taxes"
        }
      ],
      lastPublishedSynthesis:{
        "@id":"local:IdeaGraphView/329",
        "@type":"Synthesis",
        "@view":"default",
        conclusion:"La phase de divergence",
        creation_date:"2017-02-14T20:15:50.154885Z",
        idea_links:[],
        ideas:[],
        introduction:"Celle qui provient de nos discussions passionnées",
        is_next_synthesis:false,
        published_in_post:"local:Content/48269",
        subject:"phase 2"
      }
    };
    const result = SynthesisService.buildSynthesis(mockApi);
    expect(result).toEqual(expectedResult);
  });
});