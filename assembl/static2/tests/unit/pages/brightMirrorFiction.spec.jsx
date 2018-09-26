// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, mount } from 'enzyme';
import { MockedProvider } from 'react-apollo/test-utils';
import Adapter from 'enzyme-adapter-react-16';
// Graphql imports
import BrightMirrorFictionQuery from '../../../js/app/graphql/BrightMirrorFictionQuery.graphql';
import IdeaWithCommentsQuery from '../../../js/app/graphql/IdeaWithPostsQuery.graphql';
// Containers import
import { BrightMirrorFiction } from '../../../js/app/pages/brightMirrorFiction';
// Components imports
import FictionHeader from '../../../js/app/components/debate/brightMirror/fictionHeader';
import FictionToolbar from '../../../js/app/components/debate/brightMirror/fictionToolbar';
import FictionBody from '../../../js/app/components/debate/brightMirror/fictionBody';
import FictionCommentForm from '../../../js/app/components/debate/brightMirror/fictionCommentForm';
import FictionCommentList from '../../../js/app/components/debate/brightMirror/fictionCommentList';
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

const brightMirrorFictionDataTemplate = {
  fiction: {
    subject: 'Hic quia eveniet cupiditate placeat laboriosam.',
    body: 'Odit mollitia natus ea iusto voluptatibus omnis pariatur tempore ipsum.',
    creationDate: new Date(),
    publicationState: PublicationStates.PUBLISHED,
    creator: {
      userId: 99999999,
      displayName: 'Wendy Quigley',
      isDeleted: false,
      image: {
        externalUrl: 'http://tyrese.info'
      }
    }
  }
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
  contentLocaleMapping: {},
  // Mutation function
  createComment: undefined
};

describe('<BrightMirrorFiction /> - with mount', () => {
  let wrapper;
  let mocks;
  let brightMirrorFictionData: BrightMirrorFictionData;
  let ideaWithCommentsData: IdeaWithCommentsData;
  let brightMirrorFictionProps: BrightMirrorFictionProps;

  const displayNothing = () => {
    expect(wrapper.find(FictionBody)).toHaveLength(0);
    expect(wrapper.find(FictionToolbar)).toHaveLength(0);
    expect(wrapper.find(FictionBody)).toHaveLength(0);
    expect(wrapper.find(FictionCommentForm)).toHaveLength(0);
    expect(wrapper.find(FictionCommentList)).toHaveLength(0);
  };

  describe('when loading is done without error', () => {
    beforeEach(() => {
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

      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <BrightMirrorFiction {...brightMirrorFictionProps} />
        </MockedProvider>
      );
    });

    it('should render a FictionHeader', () => {
      expect(wrapper.find(FictionHeader)).toHaveLength(1);
    });

    it('should render a FictionToolbar', () => {
      expect(wrapper.find(FictionToolbar)).toHaveLength(1);
    });

    it('should render a FictionBody', () => {
      expect(wrapper.find(FictionBody)).toHaveLength(1);
    });

    it('should render a FictionCommentForm', () => {
      expect(wrapper.find(FictionCommentForm)).toHaveLength(1);
    });

    it('should render a FictionCommentList', () => {
      expect(wrapper.find(FictionCommentList)).toHaveLength(1);
    });
  });

  describe('when loading is not done', () => {
    beforeEach(() => {
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

      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <BrightMirrorFiction {...brightMirrorFictionProps} />
        </MockedProvider>
      );
    });

    it('should display nothing', () => {
      displayNothing();
    });
  });

  describe('when there is a loading error', () => {
    beforeEach(() => {
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

      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <BrightMirrorFiction {...brightMirrorFictionProps} />
        </MockedProvider>
      );
    });

    it('should display nothing', () => {
      displayNothing();
    });
  });
});