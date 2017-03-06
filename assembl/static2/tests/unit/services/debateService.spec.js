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

describe('This test concern debate Service', () => {
  it('Should return the model built from API response', () => {
    const expectedResult = {
      startDate:"2017-02-01",
      endDate:"2017-03-31",
      headerBackgroundUrl:"https://framapic.org/DTDgukI0lLFg/QvUEIscjehd8.jpg",
      objectivesBackground:{},
      socialMedias:[],
      timeline:[],
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
    const result = buildDebateData(mockApi, mockPreferences);
    expect(result).toEqual(expectedResult);
  });
});