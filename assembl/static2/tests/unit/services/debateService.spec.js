import DebateService from '../../../js/app/services/debateService';

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

const config = {
  default: {
    home: {
      header: {
        backgroundImageUrl: 'https://framapic.org/DTDgukI0lLFg/QvUEIscjehd8.jpg',
        startDate: '2017-04-01T03:14:55Z',
        endDate: '2017-06-03T03:14:55Z'
      },
      objectives: {
        img1Url: 'http://www.nyhabitat.com/fr/blog/wp-content/uploads/2014/06/guide-des-regles-de-savoir-vivre-new-york-times-square-taxis.jpg',
        img2Url: 'https://images.independenttraveler.com/homepage/newyorkbig.jpg'
      },
      steps: {
        img1Url: 'http://www.circuits-clubmed.fr/sites/default/files/clubmed_circuits_decouverte_mexique_belize_guatemala__0.jpg',
        img2Url: 'http://res.cloudinary.com/simpleview/image/upload/v1456393685/clients/norway/The_Seven_Sisters_waterfall_skagefla_Gerianger_Norway_2_1_f8c5499e-b651-465a-ba66-860b2b64c4bf.jpg',
        img3Url: 'http://www.about-stress.fr/wp-content/uploads/2016/06/mer.jpeg',
        img4Url: 'http://www.wallfizz.com/nature/fleuve-et-riviere/568-fleuve-et-riviere-WallFizz.jpg'
      },
      video: {
        videoUrl: 'https://www.youtube.com/embed/T8gC9fHGpfg',
        videoText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed cursus tellus id neque accumsan, in facilisis enim vehicula.Duis nec purus quis ligula posuere congue a non erat. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin sed sollicitudin nibh. Pellentesque id vulputate velit. Curabitur eu pharetra quam, sed pretium est. Vivamus in massa quis tellus volutpat porta ac non mauris. Nam et dolor volutpat, elementum est id, vestibulum nibh. In placerat magna vel lectus condimentum tincidunt. Integer aliquet ipsum in lacus facilisis sagittis. Mauris feugiat mollis quam a sollicitudin. Nulla iaculis est ac tellus gravida, nec convallis ex mattis. Sed tempus dolor sit amet ornare posuere.' // eslint-disable-line
      },
      twitter: {
        backgroundImageUrl: 'http://www.4ados.com/bg/757.jpg',
        id: '808390464667721728'
      }
    },
    footer: {
      socialMedias: [
        {
          title: 'Facebook',
          url: 'https://www.facebook.com/Citiesflife/?fref=ts'
        },
        {
          title: 'Twitter',
          url: 'https://twitter.com/CitiesFLife'
        },
        {
          title: 'Linkedin',
          url: 'https://www.linkedin.com/in/citiesflife/'
        }
      ]
    }
  }
};

describe('This test concern debate Service', () => {
  it('Should return the model built from API response', () => {
    const expectedResult = {
      config: {
        home: {
          header: {
            backgroundImageUrl: 'https://framapic.org/DTDgukI0lLFg/QvUEIscjehd8.jpg',
            startDate: '2017-04-01T03:14:55Z',
            endDate: '2017-06-03T03:14:55Z'
          },
          objectives: {
            img1Url: 'http://www.nyhabitat.com/fr/blog/wp-content/uploads/2014/06/guide-des-regles-de-savoir-vivre-new-york-times-square-taxis.jpg',
            img2Url: 'https://images.independenttraveler.com/homepage/newyorkbig.jpg'
          },
          steps: {
            img1Url: 'http://www.circuits-clubmed.fr/sites/default/files/clubmed_circuits_decouverte_mexique_belize_guatemala__0.jpg',
            img2Url: 'http://res.cloudinary.com/simpleview/image/upload/v1456393685/clients/norway/The_Seven_Sisters_waterfall_skagefla_Gerianger_Norway_2_1_f8c5499e-b651-465a-ba66-860b2b64c4bf.jpg',
            img3Url: 'http://www.about-stress.fr/wp-content/uploads/2016/06/mer.jpeg',
            img4Url: 'http://www.wallfizz.com/nature/fleuve-et-riviere/568-fleuve-et-riviere-WallFizz.jpg'
          },
          video: {
            videoUrl: 'https://www.youtube.com/embed/T8gC9fHGpfg',
            videoText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed cursus tellus id neque accumsan, in facilisis enim vehicula.Duis nec purus quis ligula posuere congue a non erat. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin sed sollicitudin nibh. Pellentesque id vulputate velit. Curabitur eu pharetra quam, sed pretium est. Vivamus in massa quis tellus volutpat porta ac non mauris. Nam et dolor volutpat, elementum est id, vestibulum nibh. In placerat magna vel lectus condimentum tincidunt. Integer aliquet ipsum in lacus facilisis sagittis. Mauris feugiat mollis quam a sollicitudin. Nulla iaculis est ac tellus gravida, nec convallis ex mattis. Sed tempus dolor sit amet ornare posuere.' // eslint-disable-line
          },
          twitter: {
            backgroundImageUrl: 'http://www.4ados.com/bg/757.jpg',
            id: '808390464667721728'
          }
        },
        footer: {
          socialMedias: [
            {
              title: 'Facebook',
              url: 'https://www.facebook.com/Citiesflife/?fref=ts'
            },
            {
              title: 'Twitter',
              url: 'https://twitter.com/CitiesFLife'
            },
            {
              title: 'Linkedin',
              url: 'https://www.linkedin.com/in/citiesflife/'
            }
          ]
        }
      },
      help_url: "http://assembl.bluenove.com/guides-utilisateurs-et-documentation/",
      introduction: "Débat international",
      logo: "http://www.grdf.fr/documents/10184/6812d0ec-df0c-4acc-89e1-1493d3e8712e",
      objectives: "Créé par la Ville de Medellin en 2015",
      slug: "sandbox",
      topic: "Ville connectée, quels sont les enjeux de demain ?",
    };
    const result = DebateService.buildDebateData(mockApi, config);
    expect(result).toEqual(expectedResult);
  });
});