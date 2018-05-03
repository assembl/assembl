import { buildDebateData } from '../../../js/app/services/debateService';
import { getSortedArrayByKey } from '../../../js/app/utils/globalFunctions';

const mockDiscussion = {
  translation_service_class: 'assembl.nlp.translation_service.GoogleTranslationService',
  help_url: 'help.fr',
  logo: 'logo.jpg',
  slug: 'sandbox'
};

const mockPreferences = {
  terms_of_use_url: 'terms.fr',
  extra_json: {
    headerLogoUrl: '',
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

const mockTimeline = [
  {
    end: '2017-07-29T22:00:00Z',
    description: { entries: [] },
    title: { entries: [] },
    discussion: '',
    previous_event: '',
    start: '2017-07-15T22:00:00Z',
    image_url: '',
    next_event: '',
    identifier: '',
    '@id': '',
    '@type': '',
    '@view': ''
  },
  {
    end: '2017-08-29T22:00:00Z',
    description: { entries: [] },
    title: { entries: [] },
    discussion: '',
    previous_event: '',
    start: '2017-07-30T22:00:00Z',
    image_url: '',
    next_event: '',
    identifier: '',
    '@id': '',
    '@type': '',
    '@view': ''
  },
  {
    end: '2017-06-19T22:00:00Z',
    description: { entries: [] },
    title: { entries: [] },
    discussion: '',
    previous_event: '',
    start: '2017-05-31T22:00:00Z',
    image_url: '',
    next_event: '',
    identifier: '',
    '@id': '',
    '@type': '',
    '@view': ''
  },
  {
    end: '2017-07-14T22:00:00Z',
    description: { entries: [] },
    title: { entries: [] },
    discussion: '',
    previous_event: '',
    start: '2017-06-20T22:00:00Z',
    image_url: '',
    next_event: '',
    identifier: '',
    '@id': '',
    '@type': '',
    '@view': ''
  }
];

const expectedTimeline = [
  {
    end: '2017-06-19T22:00:00Z',
    description: { entries: [] },
    title: { entries: [] },
    discussion: '',
    previous_event: '',
    start: '2017-05-31T22:00:00Z',
    image_url: '',
    next_event: '',
    identifier: '',
    '@id': '',
    '@type': '',
    '@view': ''
  },
  {
    end: '2017-07-14T22:00:00Z',
    description: { entries: [] },
    title: { entries: [] },
    discussion: '',
    previous_event: '',
    start: '2017-06-20T22:00:00Z',
    image_url: '',
    next_event: '',
    identifier: '',
    '@id': '',
    '@type': '',
    '@view': ''
  },
  {
    end: '2017-07-29T22:00:00Z',
    description: { entries: [] },
    title: { entries: [] },
    discussion: '',
    previous_event: '',
    start: '2017-07-15T22:00:00Z',
    image_url: '',
    next_event: '',
    identifier: '',
    '@id': '',
    '@type': '',
    '@view': ''
  },
  {
    end: '2017-08-29T22:00:00Z',
    description: { entries: [] },
    title: { entries: [] },
    discussion: '',
    previous_event: '',
    start: '2017-07-30T22:00:00Z',
    image_url: '',
    next_event: '',
    identifier: '',
    '@id': '',
    '@type': '',
    '@view': ''
  }
];

describe('This test concern debate Service', () => {
  it('Should return the model built from API response', () => {
    const expectedResult = {
      translationEnabled: true,
      slug: 'sandbox',
      logo: 'logo.jpg',
      topic: {
        titleEntries: {
          fr: '',
          en: ''
        }
      },
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
      headerLogoUrl: null,
      headerBackgroundUrl: null,
      timeline: expectedTimeline,
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
      customHtmlCodeRegistrationPage: null,
    };
    const result = buildDebateData(mockDiscussion, mockPreferences, getSortedArrayByKey(mockTimeline));
    expect(result).toEqual(expectedResult);
  });

  it('translationEnabled should be false', () => {
    const modifiedMockDiscussion = { ...mockDiscussion, translation_service_class: '' };
    const result = buildDebateData(modifiedMockDiscussion, mockPreferences, getSortedArrayByKey(mockTimeline));
    expect(result.translationEnabled).toEqual(false);
  });
});