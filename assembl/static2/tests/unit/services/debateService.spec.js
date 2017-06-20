import { buildDebateData } from '../../../js/app/services/debateService';

const mockApi = {
  "@id":"",
  "@type":"",
  "@view":"",
  creation_date:"",
  creator:null,
  help_url:"",
  introduction:"",
  introductionDetails:"",
  logo:"",
  objectives:"",
  permissions:{},
  show_help_in_debate_section:true,
  slug:"",
  sources:[],
  subscribe_to_notifications_on_signup:false,
  topic:"",
  translation_service_class:"",
  web_analytics_piwik_id_site:9,
  widget_collection_url:""
};

const mockPreferences = {
  "@extends": "",
  "@id": "",
  cookies_banner: true,
  terms_of_use_url: "",
  extra_json: {
    headerLogoUrl: "",
    "objectivesBackground": {
      "img1Url": "",
      "img2Url": ""
    },
    "headerBackgroundUrl": "",
    "twitter": {
      "backgroundImageUrl": "",
      "id": ""
    },
    "socialMedias": [],
    videoTitle: {
      "fr": "",
      "en": ""
    }
  },
  terms_of_use_url: "",
  name:"discussion_sandbox",
  video_description: {},
  video_url:""
};

const mockTimeline = [];

describe('This test concern debate Service', () => {
  it('Should return the model built from API response', () => {
    const expectedResult = {
      slug: "",
      logo: "",
      topic: "",
      startDate: null,
      endDate: null,
      introduction: "",
      objectives: "",
      objectivesBackground: {
        "img1Url": "",
        "img2Url": ""
      },
      videoTitle: {
        "fr": "",
        "en": ""
      },
      headerLogoUrl: null,
      headerBackgroundUrl: null,
      timeline: null,
      helpUrl: "",
      videoUrl: "",
      termsOfUseUrl: "",
      videoDescription: {},
      socialMedias: [],
      twitter: {
        "backgroundImageUrl": "",
        "id": ""
      }
    };
    const result = buildDebateData(mockApi, mockPreferences, mockTimeline);
    expect(result).toEqual(expectedResult);
  });
});