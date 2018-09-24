import { buildDebateData } from '../../../js/app/services/debateService';

const mockDiscussion = {
  translation_service_class: 'assembl.nlp.translation_service.GoogleTranslationService',
  help_url: 'help.fr',
  logo: 'logo.jpg',
  slug: 'sandbox',
  require_secure_connection: true
};

const mockPreferences = {
  terms_of_use_url: 'terms.fr',
  extra_json: {
    isLargeLogo: true,
    headerLogoUrl: '',
    footerLinks: [
      {
        titleEntries: {
          fr: 'Jaime le chocolat',
          en: 'I like chocolate'
        },
        url: 'www.google.fr'
      }
    ],
    topic: {
      titleEntries: {
        fr: '',
        en: ''
      }
    },
    introduction: {
      titleEntries: {
        fr: '',
        en: ''
      }
    },
    dates: {
      startDate: '',
      endDate: ''
    },
    headerBackgroundUrl: '',
    objectives: {
      titleEntries: {
        fr: '',
        en: ''
      },
      descriptionEntries: {
        fr: ''
      },
      images: {
        img1Url: '',
        img2Url: ''
      }
    },
    video: {
      videoUrl: '',
      titleEntries: {
        fr: '',
        en: ''
      },
      descriptionEntries: {
        fr: '',
        en: ''
      }
    },
    twitter: {
      backgroundImageUrl: '',
      id: ''
    },
    chatbot: {
      link: '',
      name: '',
      titleEntries: {
        fr: '',
        en: ''
      }
    },
    partners: [
      {
        link: '',
        logo: '',
        name: ''
      },
      {
        link: '',
        logo: '',
        name: ''
      }
    ],
    socialMedias: [
      {
        url: '',
        name: ''
      },
      {
        url: '',
        name: ''
      }
    ]
  }
};

describe('This test concern debate Service', () => {
  it('Should return the model built from API response', () => {
    const expectedResult = {
      translationEnabled: true,
      slug: 'sandbox',
      logo: 'logo.jpg',
      requireSecureConnection: true,
      topic: {
        titleEntries: {
          fr: '',
          en: ''
        }
      },
      footerLinks: [
        {
          titleEntries: {
            fr: 'Jaime le chocolat',
            en: 'I like chocolate'
          },
          url: 'www.google.fr'
        }
      ],
      dates: {
        startDate: '',
        endDate: ''
      },
      introduction: {
        titleEntries: {
          fr: '',
          en: ''
        }
      },
      objectives: {
        titleEntries: {
          fr: '',
          en: ''
        },
        descriptionEntries: {
          fr: ''
        },
        images: {
          img1Url: '',
          img2Url: ''
        }
      },
      video: {
        videoUrl: '',
        titleEntries: {
          fr: '',
          en: ''
        },
        descriptionEntries: {
          fr: '',
          en: ''
        }
      },
      isLargeLogo: true,
      headerLogoUrl: null,
      headerBackgroundUrl: null,
      helpUrl: 'help.fr',
      termsOfUseUrl: 'terms.fr',
      socialMedias: [
        {
          url: '',
          name: ''
        },
        {
          url: '',
          name: ''
        }
      ],
      twitter: {
        backgroundImageUrl: '',
        id: ''
      },
      chatbot: {
        link: '',
        name: '',
        titleEntries: {
          fr: '',
          en: ''
        }
      },
      chatframe: null,
      partners: [
        {
          link: '',
          logo: '',
          name: ''
        },
        {
          link: '',
          logo: '',
          name: ''
        }
      ],
      useSocialMedia: undefined,
      customHtmlCodeLandingPage: null,
      customHtmlCodeRegistrationPage: null
    };
    const result = buildDebateData(mockDiscussion, mockPreferences);
    expect(result).toEqual(expectedResult);
  });

  it('translationEnabled should be false', () => {
    const modifiedMockDiscussion = { ...mockDiscussion, translation_service_class: '' };
    const result = buildDebateData(modifiedMockDiscussion, mockPreferences);
    expect(result.translationEnabled).toEqual(false);
  });
});