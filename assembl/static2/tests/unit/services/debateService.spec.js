import { buildDebateData } from '../../../js/app/services/debateService';

const mockApi = {
  "@id":"local:Discussion/6",
  "@type":"Discussion",
  "@view":"default",
  creation_date:"2014-01-20T16:01:29Z",
  creator:null,
  help_url:"http://assembl.bluenove.com/guides-utilisateurs-et-documentation/",
  introduction:"Débat international",
  introductionDetails:"",
  logo:"http://www.grdf.fr/documents/10184/6812d0ec-df0c-4acc-89e1-1493d3e8712e",
  objectives:"Créé par la Ville de Medellin en 2015",
  permissions:{},
  show_help_in_debate_section:true,
  slug:"sandbox",
  sources:[],
  subscribe_to_notifications_on_signup:false,
  topic:"Ville connectée, quels sont les enjeux de demain ?",
  translation_service_class:"",
  web_analytics_piwik_id_site:9,
  widget_collection_url:"/data/Discussion/6/widgets"
};

const mockPreferences = {
  "@extends": "default",
  "@id": "local:Preferences/27",
  cookies_banner: true,
  extra_json: {
    endDate: "2017-03-31",
    headerBackgroundUrl: "https://framapic.org/DTDgukI0lLFg/QvUEIscjehd8.jpg",
    objectivesBackground: {},
    socialMedias: [],
    startDate:"2017-02-01",
    timeline: [],
    twitter:{}
  },
  name:"discussion_sandbox",
  video_description:{
    fr:"Bonjour le monde !",
    en:"Hello world!"
  },
  video_url:"https://www.youtube.com/embed/T8gC9fHGpfg"
};

const mockTimeline = [
  {
    "end": "2017-04-29T21:59:00Z",
    "description": {
      "@id": "local:LangString/20821",
      "@type": "LangString",
      "@view": "extended",
      "entries": [
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20906",
          "@type": "LangStringEntry",
          "value": "Donec rhoncus nibh diam, ut facilisis risus fringilla sit amet",
          "@language": "fr"
        },
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20905",
          "@type": "LangStringEntry",
          "value": "Deepening phase of the ideas inclined to be submitted during the voting phase.",
          "@language": "en"
        }
      ]
    },
    "title": {
      "@id": "local:LangString/20820",
      "@type": "LangString",
      "@view": "extended",
      "entries": [
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20894",
          "@type": "LangStringEntry",
          "value": "Convergence phase",
          "@language": "en"
        },
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20893",
          "@type": "LangStringEntry",
          "value": "Phase de convergence",
          "@language": "fr"
        }
      ]
    },
    "discussion": "local:Discussion/6",
    "previous_event": "local:TimelineEvent/5",
    "start": "2017-04-14T22:00:00Z",
    "image_url": "https://framapic.org/cKULJ8P6VLFr/Nojx87ovxtjC.jpg",
    "identifier": "TokenVote",
    "@id": "local:TimelineEvent/6",
    "@type": "DiscussionPhase",
    "@view": "default"
  },
  {
    "end": "2017-04-14T21:59:00Z",
    "description": {
      "@id": "local:LangString/20819",
      "@type": "LangString",
      "@view": "extended",
      "entries": [
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20904",
          "@type": "LangStringEntry",
          "value": "Phasellus vitae volutpat ex, quis pulvinar ipsum.",
          "@language": "en"
        },
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20903",
          "@type": "LangStringEntry",
          "value": "Phase d'approffondissement des idées enclines être soumises lors de la phase de vote.",
          "@language": "fr"
        }
      ]
    },
    "title": {
      "@id": "local:LangString/20818",
      "@type": "LangString",
      "@view": "extended",
      "entries": [
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20888",
          "@type": "LangStringEntry",
          "value": "Exploration phase",
          "@language": "en"
        },
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20887",
          "@type": "LangStringEntry",
          "value": "Phase d'exploration",
          "@language": "fr"
        }
      ]
    },
    "discussion": "local:Discussion/6",
    "previous_event": "local:TimelineEvent/2",
    "start": "2017-03-30T22:00:00Z",
    "image_url": "https://framapic.org/3CL5o6dir9Vk/xQ0Uckbi7ckp.jpg",
    "next_event": "local:TimelineEvent/6",
    "identifier": "TwoColumns",
    "@id": "local:TimelineEvent/5",
    "@type": "DiscussionPhase",
    "@view": "default"
  },
  {
    "end": "2017-03-30T21:59:00Z",
    "description": {
      "@id": "local:LangString/20813",
      "@type": "LangString",
      "@view": "extended",
      "entries": [
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20902",
          "@type": "LangStringEntry",
          "value": "Phasellus vitae volutpat ex, quis pulvinar ipsum.",
          "@language": "en"
        },
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20901",
          "@type": "LangStringEntry",
          "value": "Phasellus vitae volutpat ex, quis pulvinar ipsum.",
          "@language": "fr"
        }
      ]
    },
    "title": {
      "@id": "local:LangString/20812",
      "@type": "LangString",
      "@view": "extended",
      "entries": [
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20870",
          "@type": "LangStringEntry",
          "value": "Divergence phase",
          "@language": "en"
        },
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20869",
          "@type": "LangStringEntry",
          "value": "Phase de divergence",
          "@language": "fr"
        }
      ]
    },
    "discussion": "local:Discussion/6",
    "previous_event": "local:TimelineEvent/1",
    "start": "2017-03-15T23:00:00Z",
    "image_url": "https://framapic.org/pF0R9jQM5Aof/MortpNh6czMP.jpg",
    "next_event": "local:TimelineEvent/5",
    "identifier": "Thread",
    "@id": "local:TimelineEvent/2",
    "@type": "DiscussionPhase",
    "@view": "default"
  },
  {
    "end": "2017-03-15T22:59:00Z",
    "description": {
      "@id": "local:LangString/20811",
      "@type": "LangString",
      "@view": "extended",
      "entries": [
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20900",
          "@type": "LangStringEntry",
          "value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          "@language": "en"
        },
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20899",
          "@type": "LangStringEntry",
          "value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
          "@language": "fr"
        }
      ]
    },
    "title": {
      "@id": "local:LangString/20810",
      "@type": "LangString",
      "@view": "extended",
      "entries": [
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20864",
          "@type": "LangStringEntry",
          "value": "Discovery phase",
          "@language": "en"
        },
        {
          "@view": "extended",
          "@id": "local:LangStringEntry/20863",
          "@type": "LangStringEntry",
          "value": "Phase de découverte",
          "@language": "fr"
        }
      ]
    },
    "discussion": "local:Discussion/6",
    "previous_event": null,
    "start": "2017-02-28T23:00:00Z",
    "image_url": "https://framapic.org/CiOjTZIVLFgg/9Xr4dPUMDZJG.jpg",
    "next_event": "local:TimelineEvent/2",
    "identifier": "Survey",
    "@id": "local:TimelineEvent/1",
    "@type": "DiscussionPhase",
    "@view": "default"
  }
];

describe('This test concern debate Service', () => {
  it('Should return the model built from API response', () => {
    const expectedResult = {
      startDate:"2017-02-28T23:00:00Z",
      endDate:"2017-04-29T21:59:00Z",
      headerBackgroundUrl:"https://framapic.org/DTDgukI0lLFg/QvUEIscjehd8.jpg",
      objectivesBackground:{},
      socialMedias:[],
      timeline:[
        {
          "end": "2017-03-15T22:59:00Z",
          "description": {
            "@id": "local:LangString/20811",
            "@type": "LangString",
            "@view": "extended",
            "entries": [
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20900",
                "@type": "LangStringEntry",
                "value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                "@language": "en"
              },
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20899",
                "@type": "LangStringEntry",
                "value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                "@language": "fr"
              }
            ]
          },
          "title": {
            "@id": "local:LangString/20810",
            "@type": "LangString",
            "@view": "extended",
            "entries": [
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20864",
                "@type": "LangStringEntry",
                "value": "Discovery phase",
                "@language": "en"
              },
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20863",
                "@type": "LangStringEntry",
                "value": "Phase de découverte",
                "@language": "fr"
              }
            ]
          },
          "discussion": "local:Discussion/6",
          "previous_event": null,
          "start": "2017-02-28T23:00:00Z",
          "image_url": "https://framapic.org/CiOjTZIVLFgg/9Xr4dPUMDZJG.jpg",
          "next_event": "local:TimelineEvent/2",
          "identifier": "Survey",
          "@id": "local:TimelineEvent/1",
          "@type": "DiscussionPhase",
          "@view": "default"
        },
        {
          "end": "2017-03-30T21:59:00Z",
          "description": {
            "@id": "local:LangString/20813",
            "@type": "LangString",
            "@view": "extended",
            "entries": [
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20902",
                "@type": "LangStringEntry",
                "value": "Phasellus vitae volutpat ex, quis pulvinar ipsum.",
                "@language": "en"
              },
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20901",
                "@type": "LangStringEntry",
                "value": "Phasellus vitae volutpat ex, quis pulvinar ipsum.",
                "@language": "fr"
              }
            ]
          },
          "title": {
            "@id": "local:LangString/20812",
            "@type": "LangString",
            "@view": "extended",
            "entries": [
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20870",
                "@type": "LangStringEntry",
                "value": "Divergence phase",
                "@language": "en"
              },
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20869",
                "@type": "LangStringEntry",
                "value": "Phase de divergence",
                "@language": "fr"
              }
            ]
          },
          "discussion": "local:Discussion/6",
          "previous_event": "local:TimelineEvent/1",
          "start": "2017-03-15T23:00:00Z",
          "image_url": "https://framapic.org/pF0R9jQM5Aof/MortpNh6czMP.jpg",
          "next_event": "local:TimelineEvent/5",
          "identifier": "Thread",
          "@id": "local:TimelineEvent/2",
          "@type": "DiscussionPhase",
          "@view": "default"
        },
        {
          "end": "2017-04-14T21:59:00Z",
          "description": {
            "@id": "local:LangString/20819",
            "@type": "LangString",
            "@view": "extended",
            "entries": [
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20904",
                "@type": "LangStringEntry",
                "value": "Phasellus vitae volutpat ex, quis pulvinar ipsum.",
                "@language": "en"
              },
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20903",
                "@type": "LangStringEntry",
                "value": "Phase d'approffondissement des idées enclines être soumises lors de la phase de vote.",
                "@language": "fr"
              }
            ]
          },
          "title": {
            "@id": "local:LangString/20818",
            "@type": "LangString",
            "@view": "extended",
            "entries": [
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20888",
                "@type": "LangStringEntry",
                "value": "Exploration phase",
                "@language": "en"
              },
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20887",
                "@type": "LangStringEntry",
                "value": "Phase d'exploration",
                "@language": "fr"
              }
            ]
          },
          "discussion": "local:Discussion/6",
          "previous_event": "local:TimelineEvent/2",
          "start": "2017-03-30T22:00:00Z",
          "image_url": "https://framapic.org/3CL5o6dir9Vk/xQ0Uckbi7ckp.jpg",
          "next_event": "local:TimelineEvent/6",
          "identifier": "TwoColumns",
          "@id": "local:TimelineEvent/5",
          "@type": "DiscussionPhase",
          "@view": "default"
        },
        {
          "end": "2017-04-29T21:59:00Z",
          "description": {
            "@id": "local:LangString/20821",
            "@type": "LangString",
            "@view": "extended",
            "entries": [
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20906",
                "@type": "LangStringEntry",
                "value": "Donec rhoncus nibh diam, ut facilisis risus fringilla sit amet",
                "@language": "fr"
              },
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20905",
                "@type": "LangStringEntry",
                "value": "Deepening phase of the ideas inclined to be submitted during the voting phase.",
                "@language": "en"
              }
            ]
          },
          "title": {
            "@id": "local:LangString/20820",
            "@type": "LangString",
            "@view": "extended",
            "entries": [
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20894",
                "@type": "LangStringEntry",
                "value": "Convergence phase",
                "@language": "en"
              },
              {
                "@view": "extended",
                "@id": "local:LangStringEntry/20893",
                "@type": "LangStringEntry",
                "value": "Phase de convergence",
                "@language": "fr"
              }
            ]
          },
          "discussion": "local:Discussion/6",
          "previous_event": "local:TimelineEvent/5",
          "start": "2017-04-14T22:00:00Z",
          "image_url": "https://framapic.org/cKULJ8P6VLFr/Nojx87ovxtjC.jpg",
          "identifier": "TokenVote",
          "@id": "local:TimelineEvent/6",
          "@type": "DiscussionPhase",
          "@view": "default"
        }
      ],
      twitter:{},
      videoDescription:{
        fr:"Bonjour le monde !",
        en:"Hello world!"
      },
      videoUrl:"https://www.youtube.com/embed/T8gC9fHGpfg",
      helpUrl: "http://assembl.bluenove.com/guides-utilisateurs-et-documentation/",
      introduction: "Débat international",
      logo: "http://www.grdf.fr/documents/10184/6812d0ec-df0c-4acc-89e1-1493d3e8712e",
      objectives: "Créé par la Ville de Medellin en 2015",
      slug: "sandbox",
      topic: "Ville connectée, quels sont les enjeux de demain ?",
    };
    const result = buildDebateData(mockApi, mockPreferences, mockTimeline);
    expect(result).toEqual(expectedResult);
  });
});