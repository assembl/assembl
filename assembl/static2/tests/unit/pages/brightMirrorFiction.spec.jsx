// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, mount } from 'enzyme';
import { MockedProvider } from 'react-apollo/test-utils';
import Adapter from 'enzyme-adapter-react-16';
import { Map } from 'immutable';
import configureStore from 'redux-mock-store';

// Graphql imports
import BrightMirrorFictionQuery from '../../../js/app/graphql/BrightMirrorFictionQuery.graphql';
import IdeaWithCommentsQuery from '../../../js/app/graphql/IdeaWithPostsQuery.graphql';
// Containers import
import { BrightMirrorFiction } from '../../../js/app/pages/brightMirrorFiction';
// Components imports
import FictionToolbar from '../../../js/app/components/debate/brightMirror/fictionToolbar';
import FictionBody from '../../../js/app/components/debate/brightMirror/fictionBody';
import FictionCommentHeader from '../../../js/app/components/debate/brightMirror/fictionCommentHeader';
import FictionCommentForm from '../../../js/app/components/debate/brightMirror/fictionCommentForm';
import FictionCommentList from '../../../js/app/components/debate/brightMirror/fictionCommentList';
import TagOnPost from '../../../js/app/components/tagOnPost/tagOnPost';
// Constant imports
import { PublicationStates } from '../../../js/app/constants';
// Type imports
import type {
  BrightMirrorFictionProps,
  BrightMirrorFictionData,
  IdeaWithCommentsData
} from '../../../js/app/pages/brightMirrorFiction';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^BrightMirrorFiction$/
});

configure({ adapter: new Adapter() });

// Mock utils functions
jest.mock('../../../js/app/utils/utilityManager', () => ({ displayAlert: jest.fn() }));
jest.mock('../../../js/app/pages/idea', () => ({
  getDebateTotalMessages: jest.fn(() => 9876),
  transformPosts: jest.fn(() => [{ id: 'fictionId', children: ['yyy', 'zzz'] }])
}));
jest.mock('../../../js/app/utils/timeline', () => ({
  getIsPhaseCompletedById: jest.fn(() => false)
}));

const brightMirrorFictionDataTemplate = {
  fiction: {
    id: '1',
    dbId: 1,
    subjectEntries: [{ value: 'Hic quia eveniet cupiditate placeat laboriosam.', localeCode: 'fr' }],
    bodyEntries: [{ value: 'Odit mollitia natus ea iusto voluptatibus omnis pariatur tempore ipsum.', localeCode: 'fr' }],
    creationDate: new Date(),
    publicationState: PublicationStates.PUBLISHED,
    modified: false,
    creator: {
      id: '99999999',
      userId: 99999999,
      displayName: 'Wendy Quigley',
      isDeleted: false,
      image: {
        externalUrl: 'http://tyrese.info'
      }
    },
    parentPostCreator: {
      displayName: 'Wendy Quigley'
    },
    bodyMimeType: 'text/html',
    extracts: [],
    mySentiment: 'LIKE',
    sentimentCounts: {
      disagree: 0,
      dontUnderstand: 0,
      like: 0,
      moreInfo: 0
    },
    keywords: [
      {
        count: 1,
        score: 0.6075,
        value: 'complete account of the system'
      },
      {
        count: 1,
        score: 0.600927,
        value: 'great pleasure'
      },
      {
        count: 1,
        score: 0.607114,
        value: 'actual teachings of the great explorer of the truth'
      }
    ],
    tags: [{ id: '0', value: 'Habitat et SDF' }, { id: '1', value: 'Facilitation' }]
  },
  error: null,
  refetch: () => {}
};

const ideaWithCommentsDataTemplate = {
  idea: {
    id: 'aaaaaaaaaa',
    numPosts: 999,
    posts: {
      edges: [
        { node: { id: 'aaaaaaaaaa', parentId: 'fictionId' } },
        { node: { id: 'bbbbbbbbbb', parentId: 'fictionId' } },
        { node: { id: 'cccccccccc', parentId: 'fictionId' } }
      ]
    }
  }
};

const brightMirrorFictionPropsTemplate = {
  slug: 'voluptatem-veritatis-ea',
  phase: 'hic',
  themeId: 'nihil',
  fictionId: 'fictionId',
  contentLocale: 'en',
  contentLocaleMapping: Map(),
  // Mutation function
  createComment: undefined,
  existingTags: [],
  putTagsInStore: jest.fn()
};

const timeline = [
  {
    identifier: 'foo',
    id: 'FooID',
    start: 'date1',
    end: 'date2',
    title: { entries: [{ en: 'Foo' }] }
  }
];

describe('<BrightMirrorFiction /> - with mount', () => {
  let wrapper;
  let mocks;
  let brightMirrorFictionData: BrightMirrorFictionData;
  let ideaWithCommentsData: IdeaWithCommentsData;
  let brightMirrorFictionProps: BrightMirrorFictionProps;

  const initialState = { tags: [], i18n: { locale: 'en' } };
  const mockStore = configureStore();

  const displayNothing = () => {
    expect(wrapper.find(FictionBody)).toHaveLength(0);
    expect(wrapper.find(FictionToolbar)).toHaveLength(0);
    expect(wrapper.find(FictionBody)).toHaveLength(0);
    expect(wrapper.find(FictionCommentHeader)).toHaveLength(0);
    expect(wrapper.find(FictionCommentForm)).toHaveLength(0);
    expect(wrapper.find(FictionCommentList)).toHaveLength(0);
  };

  describe('when loading is done without error', () => {
    beforeEach(() => {
      window.getSelection = () => ({
        removeAllRanges: () => {}
      });
      // Define props
      brightMirrorFictionData = {
        ...brightMirrorFictionDataTemplate,
        loading: false,
        error: null
      };

      ideaWithCommentsData = {
        ...ideaWithCommentsDataTemplate,
        loading: false,
        error: null,
        refetch: () => null
      };

      brightMirrorFictionProps = {
        brightMirrorFictionData: brightMirrorFictionData,
        ideaWithCommentsData: ideaWithCommentsData,
        phaseId: '2',
        timeline: timeline,
        screenWidth: 100,
        ...brightMirrorFictionPropsTemplate
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: BrightMirrorFictionQuery },
          result: {
            brightMirrorFictionData: brightMirrorFictionData
          }
        },
        {
          request: { query: IdeaWithCommentsQuery },
          result: {
            brightMirrorFictionData: ideaWithCommentsData
          }
        }
      ];

      const store = mockStore(initialState);

      // Create DOM to allow document.getElementById function
      const div = document.createElement('div');
      window.domNode = div;
      // $FlowFixMe because document.body may be null
      document.body.appendChild(div);

      wrapper = mount(
        <MockedProvider mocks={mocks} store={store}>
          <BrightMirrorFiction {...brightMirrorFictionProps} />
        </MockedProvider>,
        { attachTo: window.domNode }
      );
    });

    it('should render a FictionToolbar', () => {
      expect(wrapper.find(FictionToolbar)).toHaveLength(1);
    });

    it('should render a FictionBody', () => {
      expect(wrapper.find(FictionBody)).toHaveLength(1);
    });

    it('should render a FictionCommentHeader', () => {
      expect(wrapper.find(FictionCommentHeader)).toHaveLength(1);
    });

    it('should not render a FictionCommentForm when user is not connected', () => {
      expect(wrapper.find(FictionCommentForm)).toHaveLength(0);
    });

    it('should render a FictionCommentList', () => {
      expect(wrapper.find(FictionCommentList)).toHaveLength(1);
    });

    it('should render a TagOnPost', () => {
      expect(wrapper.find(TagOnPost)).toHaveLength(1);
    });
  });

  describe('when loading is not done', () => {
    beforeEach(() => {
      window.getSelection = () => ({
        removeAllRanges: () => {}
      });
      // Define props
      brightMirrorFictionData = {
        ...brightMirrorFictionDataTemplate,
        loading: true, // set loading to true
        error: null
      };

      ideaWithCommentsData = {
        ...ideaWithCommentsDataTemplate,
        loading: true, // set loading to true
        error: null,
        refetch: () => null
      };

      brightMirrorFictionProps = {
        brightMirrorFictionData: brightMirrorFictionData,
        ideaWithCommentsData: ideaWithCommentsData,
        phaseId: '2',
        timeline: timeline,
        screenWidth: 100,
        ...brightMirrorFictionPropsTemplate
      };
      // Mock Apollo
      mocks = [
        {
          request: { query: BrightMirrorFictionQuery },
          result: {
            data: brightMirrorFictionData
          }
        }
      ];

      const store = mockStore(initialState);

      // Create DOM to allow document.getElementById function
      const div = document.createElement('div');
      window.domNode = div;
      // $FlowFixMe because document.body may be null
      document.body.appendChild(div);

      wrapper = mount(
        <MockedProvider mocks={mocks} store={store}>
          <BrightMirrorFiction {...brightMirrorFictionProps} />
        </MockedProvider>,
        { attachTo: window.domNode }
      );
    });

    it('should display nothing', () => {
      displayNothing();
    });
  });

  describe('when there is a loading error', () => {
    beforeEach(() => {
      window.getSelection = () => ({
        removeAllRanges: () => {}
      });
      // Define props
      brightMirrorFictionData = {
        ...brightMirrorFictionDataTemplate,
        loading: false,
        error: { dummy: 'error' } // set loading error
      };

      ideaWithCommentsData = {
        ...ideaWithCommentsDataTemplate,
        loading: false,
        error: { dummy: 'error' }, // set loading error
        refetch: () => null
      };

      brightMirrorFictionProps = {
        brightMirrorFictionData: brightMirrorFictionData,
        ideaWithCommentsData: ideaWithCommentsData,
        phaseId: '2',
        timeline: timeline,
        screenWidth: 100,
        ...brightMirrorFictionPropsTemplate
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: BrightMirrorFictionQuery },
          result: {
            data: brightMirrorFictionData
          }
        }
      ];

      const store = mockStore(initialState);

      // Create DOM to allow document.getElementById function
      const div = document.createElement('div');
      window.domNode = div;
      // $FlowFixMe because document.body may be null
      document.body.appendChild(div);

      wrapper = mount(
        <MockedProvider mocks={mocks} store={store}>
          <BrightMirrorFiction {...brightMirrorFictionProps} />
        </MockedProvider>,
        { attachTo: window.domNode }
      );
    });

    it('should display nothing', () => {
      displayNothing();
    });
  });
});