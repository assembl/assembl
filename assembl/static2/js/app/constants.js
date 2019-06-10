// @flow
import moment from 'moment';
import ThematicsMenu from './components/administration/thematicsMenu';

export const DEFAULT_FAVICON = '/static/img/icon/infinite-1.png';
export const ICONS_PATH = '/static2/img/icons';
export const EXTRA_SMALL_SCREEN_WIDTH = 600;
export const SMALL_SCREEN_WIDTH = 768;
export const SMALL_SCREEN_HEIGHT = 812;
export const MEDIUM_SCREEN_WIDTH = 992;
export const APP_CONTAINER_MAX_WIDTH = 1400;
export const IDEA_PREVIEW_MAX_WIDTH = 350;
export const IDEA_PREVIEW_MIN_WIDTH = 280;
// export const IDEA_PREVIEW_MIN_WIDTH = 280;
export const NB_IDEA_PREVIEW_TO_SHOW = 4;
export const APP_CONTAINER_PADDING = 15;
export const MIN_WIDTH_COLUMN = 400;
export const COLUMN_OPACITY_GAIN = 0.5;

export const SM_SCREEN_WIDTH = 768;
export const LG_SCREEN_WIDTH = 1200;

// Semantic analysis
export const KEYWORD_SCORE_THRESHOLD = 0.5;

// Synthesis and Bright mirror
export const DELETE_CALLBACK = 'DELETE_CALLBACK';

// Bright mirror
export const EMPTY_STRING = '';
export const USER_ID_NOT_FOUND = -9999;
export const PICTURES_LENGTH = 40; // Number of pictures available on S3
export const PICTURE_BASE_URL = 'https://s3-eu-west-1.amazonaws.com';
export const BM_PICTURE_BASE_URL = `${PICTURE_BASE_URL}/bluenove-assembl-images/bm/preview-`;
export const SEMANTIC_ANALYSIS_PICTURE_BANNER_URL = `${PICTURE_BASE_URL}/bluenove-assembl-images/banner-semantic.png`;
export const PICTURE_EXTENSION = '.jpg';

// Minimum length for survey answers
export const MINIMUM_BODY_LENGTH = 10;

export const ANCHOR_SIZE = 44;
export const ANCHOR_OFFSET = 6;
export const COMMENT_BADGE_OFFSET = 10.5;
export const COMMENT_BOX_OFFSET = 40;
export const COMMENT_DYNAMIC_OFFSET = 5;
export const SENTIMENT_RIGHT_OFFSET = 15;
export const SENTIMENT_BAR_TOP_POSITION_OFFSET = 78;

export const MAX_TREE_FORM_LEVEL = 4;

export const SECTION_PERSONALIZE_INTERFACE = '1';
export const SECTION_DISCUSSION_PREFERENCES = '2';
export const SECTION_TIMELINE = '3';
export const SECTION_PROFILE_OPTIONS = '4';
export const SECTION_MENU_SECTION = '5';
export const SECTION_LEGAL_CONTENTS = '6';

export const APOLLO_NETWORK_STATUS = {
  /**
   * The query has never been run before and the query is now currently running. A query will still
   * have this network status even if a partial data result was returned from the cache, but a
   * query was dispatched anyway.
   */
  loading: 1,

  /**
   * If `setVariables` was called and a query was fired because of that then the network status
   * will be `setVariables` until the result of that query comes back.
   */
  setVariables: 2,

  /**
   * Indicates that `fetchMore` was called on this query and that the query created is currently in
   * flight.
   */
  fetchMore: 3,

  /**
   * Similar to the `setVariables` network status. It means that `refetch` was called on a query
   * and the refetch request is currently in flight.
   */
  refetch: 4,

  /**
   * No request is in flight for this query, and no errors happened. Everything is OK.
   */
  ready: 7
};

export const PHASE_STATUS = {
  notStarted: 'notStarted',
  completed: 'completed',
  inProgress: 'inProgress'
};

export const PHASES = {
  survey: 'survey',
  thread: 'thread',
  multiColumns: 'multiColumns',
  voteSession: 'voteSession',
  brightMirror: 'brightMirror'
};

export const MESSAGE_VIEW = {
  noModule: 'noModule',
  survey: 'survey',
  thread: 'thread',
  messageColumns: 'messageColumns',
  voteSession: 'voteSession',
  brightMirror: 'brightMirror'
};

export const COOKIE_TYPES = [
  'ACCEPT_TRACKING_ON_DISCUSSION',
  'ACCEPT_SESSION_ON_DISCUSSION',
  'REJECT_TRACKING_ON_DISCUSSION',
  'REJECT_SESSION_ON_DISCUSSION',
  'ACCEPT_LOCALE',
  'REJECT_LOCALE',
  'ACCEPT_PRIVACY_POLICY_ON_DISCUSSION',
  'REJECT_PRIVACY_POLICY_ON_DISCUSSION',
  'ACCEPT_USER_GUIDELINE_ON_DISCUSSION',
  'REJECT_USER_GUIDELINE_ON_DISCUSSION',
  'ACCEPT_CGU',
  'REJECT_CGU'
];

export const SENTIMENTS = {
  like: 'LIKE',
  disagree: 'DISAGREE',
  dontUnderstand: 'DONT_UNDERSTAND',
  moreInfo: 'MORE_INFO'
};

export const ESSENTIAL_SIGNUP_COOKIES = [
  'ACCEPT_CGU',
  'ACCEPT_PRIVACY_POLICY_ON_DISCUSSION',
  'ACCEPT_USER_GUIDELINE_ON_DISCUSSION'
];

export const COOKIE_TRANSLATION_KEYS = {
  userSession: 'userSession',
  locale: 'locale',
  matomo: 'matomo',
  privacyPolicy: 'privacyPolicy',
  userGuideline: 'userGuideline',
  cgu: 'cgu'
};

export const COOKIES_CATEGORIES = {
  essential: 'essential',
  analytics: 'analytics',
  other: 'other'
};

export const ADMIN_MENU = {
  discussion: {
    title: 'administration.edition',
    sectionId: '1',
    subMenu: {
      personalizeInterface: {
        title: 'administration.menu.personalizeInterface',
        sectionId: SECTION_PERSONALIZE_INTERFACE
      },
      preferences: {
        title: 'administration.menu.preferences',
        sectionId: SECTION_DISCUSSION_PREFERENCES
      },
      timeline: {
        title: 'administration.menu.timeline',
        sectionId: SECTION_TIMELINE
      },
      manageProfileOptions: {
        title: 'administration.menu.manageProfileOptions',
        sectionId: SECTION_PROFILE_OPTIONS
      },
      sections: {
        title: 'administration.menu.sections',
        sectionId: SECTION_MENU_SECTION
      },
      legalContents: {
        title: 'administration.menu.legalContents',
        sectionId: SECTION_LEGAL_CONTENTS
      }
    }
  },
  exportDebateData: {
    title: 'administration.menu.exportDebateData',
    sectionId: '1',
    subMenu: {
      contributions: {
        title: 'administration.export.contributions',
        sectionId: '1'
      },
      taxonomies: {
        title: 'administration.menu.exportTaxonomies',
        sectionId: '2'
      }
    }
  },
  landingPage: {
    title: 'administration.landingpage',
    sectionId: '1',
    subMenu: {
      header: {
        title: 'administration.landingPage.header.title',
        sectionId: '1'
      },
      textMultimedia: {
        title: 'administration.landingPage.textMultimedia.title',
        sectionId: '2'
      }
      // manageModules: {
      //   title: 'administration.landingPage.manageModules.title',
      //   sectionId: '2'
      // }
    }
  },
  resourcesCenter: {
    title: 'administration.resourcesCenter.menuTitle',
    sectionId: ''
  },
  voteSession: {
    title: 'administration.voteSession.configureVoteSession',
    sectionId: '1',
    subMenu: {
      pageConfiguration: {
        title: 'administration.voteSession.0',
        sectionId: '1'
      },
      configureVotingModules: {
        title: 'administration.voteSession.1',
        sectionId: '2'
      },
      configureVotingProposals: {
        title: 'administration.voteSession.2',
        sectionId: '3'
      }
    }
  }
};

export const PHASES_ADMIN_MENU = {
  survey: {
    sectionId: '1',
    subMenu: {
      setThemes: {
        title: 'administration.survey.createTable',
        sectionId: '1'
      },
      configThematics: {
        title: 'administration.survey.configThematics',
        sectionId: 'configThematics',
        component: ThematicsMenu
      }
    }
  }
};

// Those states lists need to be kept in sync with models/post.py
export const PublicationStates = {
  DRAFT: 'DRAFT',
  SUBMITTED_AWAITING_MODERATION: 'SUBMITTED_AWAITING_MODERATION',
  SUBMITTED_IN_EDIT_GRACE_PERIOD: 'SUBMITTED_IN_EDIT_GRACE_PERIOD',
  PUBLISHED: 'PUBLISHED',
  MODERATED_TEXT_ON_DEMAND: 'MODERATED_TEXT_ON_DEMAND',
  MODERATED_TEXT_NEVER_AVAILABLE: 'MODERATED_TEXT_NEVER_AVAILABLE',
  DELETED_BY_USER: 'DELETED_BY_USER',
  DELETED_BY_ADMIN: 'DELETED_BY_ADMIN'
};

// Those states lists need to be kept in sync with models/idea_content_link.py
export const ExtractStates = {
  SUBMITTED: 'SUBMITTED',
  PUBLISHED: 'PUBLISHED'
};

export type ExtractState = typeof ExtractStates.SUBMITTED | typeof ExtractStates.PUBLISHED;

export const pickerColors = [
  '#B8E986',
  '#00AA7B',
  '#FCB900',
  '#FF6900',
  '#8646ED',
  '#FF82BE',
  '#00DCFF',
  '#1652C1',
  '#EB144C',
  '#000000'
];

export const fictionBackgroundColors = [
  '#ffcdd2',
  '#e1bee7',
  '#d1c4e9',
  '#c5cae9',
  '#bbdefb',
  '#b3e5fc',
  '#b2ebf2',
  '#b2dfdb',
  '#c8e6c9',
  '#dcedc8',
  '#f0f4c3',
  '#fff9c4',
  '#ffecb3',
  '#ffe0b2',
  '#ffccbc',
  '#d7ccc8',
  '#cfd8dc'
];

export const modulesTranslationKeys = [
  MESSAGE_VIEW.noModule,
  MESSAGE_VIEW.survey,
  MESSAGE_VIEW.thread,
  MESSAGE_VIEW.messageColumns,
  MESSAGE_VIEW.voteSession,
  MESSAGE_VIEW.brightMirror
];

export const BlockingPublicationStates = {};
BlockingPublicationStates[PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE] = PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE;
BlockingPublicationStates[PublicationStates.DELETED_BY_USER] = PublicationStates.DELETED_BY_USER;
BlockingPublicationStates[PublicationStates.DELETED_BY_ADMIN] = PublicationStates.DELETED_BY_ADMIN;

export const ModeratedPublicationStates = {};
ModeratedPublicationStates[PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE] = PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE;
ModeratedPublicationStates[PublicationStates.MODERATED_TEXT_ON_DEMAND] = PublicationStates.MODERATED_TEXT_ON_DEMAND;

export const DeletedPublicationStates = {};
DeletedPublicationStates[PublicationStates.DELETED_BY_USER] = PublicationStates.DELETED_BY_USER;
DeletedPublicationStates[PublicationStates.DELETED_BY_ADMIN] = PublicationStates.DELETED_BY_ADMIN;

export const CountablePublicationStates = {};
CountablePublicationStates[PublicationStates.SUBMITTED_IN_EDIT_GRACE_PERIOD] = PublicationStates.SUBMITTED_IN_EDIT_GRACE_PERIOD;
CountablePublicationStates[PublicationStates.PUBLISHED] = PublicationStates.PUBLISHED;
CountablePublicationStates[PublicationStates.MODERATED_TEXT_ON_DEMAND] = PublicationStates.MODERATED_TEXT_ON_DEMAND;
CountablePublicationStates[PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE] = PublicationStates.MODERATED_TEXT_NEVER_AVAILABLE;

export type ColorDefinition = {
  background: string,
  text: string | null
};

export const harvestingColors: { [string]: ColorDefinition } = {
  blue: {
    background: '#00B6FF',
    text: null
  },
  yellow: {
    background: '#FFEC00',
    text: null
  },
  orange: {
    background: '#FF9F00',
    text: null
  },
  red: {
    background: '#FF001F',
    text: null
  },
  green: {
    background: '#35C646',
    text: null
  },
  purple: {
    background: '#BD10E0',
    text: null
  },
  black: {
    background: '#000000',
    text: '#FFFFFF'
  },
  green2: {
    background: '#7ed321', // default color
    text: null
  },
  pink: {
    background: '#FF9BB4',
    text: null
  },
  paleGreen: {
    background: '#B8E986',
    text: null
  }
};

export const legalContentSlugs = ['terms', 'privacy-policy', 'user-guidelines'];

export const harvestingColorsMapping: { [string]: ColorDefinition } = {
  concept: harvestingColors.blue,
  argument: harvestingColors.yellow,
  example: harvestingColors.orange,
  issue: harvestingColors.red,
  actionable_solution: harvestingColors.green,
  knowledge: harvestingColors.purple,
  cognitive_bias: harvestingColors.black
};

export const pendingOrange = '#ffd58f"';

export const ANNOUNCEMENT_TAB_ITEM_ID = {
  GUIDELINES: 0,
  SUMMARY: 1,
  SEMANTIC_ANALYSIS: 2
};

export const slugAllowedCharacters = /^[a-zA-Z0-9(-]+$/g;

export const availableLocales = [
  'de',
  'en',
  'es',
  'fr',
  'hu',
  'it',
  'ja',
  'nl',
  'no',
  'pl',
  'pt',
  'ro',
  'ru',
  'th',
  'tr',
  'zh_Hans'
];

export const datePickerPresets = [
  {
    id: 'today',
    labelTranslationKey: 'administration.export.presets.today',
    range: { startDate: moment(), endDate: moment() },
    type: 'basic'
  },
  {
    id: 'lastWeek',
    labelTranslationKey: 'administration.export.presets.lastWeek',
    range: { startDate: moment().subtract(7, 'days'), endDate: moment() },
    type: 'basic'
  },
  {
    id: 'lastMonth',
    labelTranslationKey: 'administration.export.presets.lastMonth',
    range: { startDate: moment().subtract(1, 'month'), endDate: moment() },
    type: 'basic'
  }
];