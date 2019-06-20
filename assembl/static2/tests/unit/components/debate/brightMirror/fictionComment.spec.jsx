// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
// import initStoryshots from '@storybook/addon-storyshots';
import { configure, mount, shallow } from 'enzyme';
import { MockedProvider } from 'react-apollo/test-utils';
import Adapter from 'enzyme-adapter-react-16';
// GraphQL imports
import CommentQuery from '../../../../../js/app/graphql/BrightMirrorFictionQuery.graphql';
// Components imports
import FictionComment, {
  FictionComment as ShallowFictionComment
} from '../../../../../js/app/components/debate/brightMirror/fictionComment';
import DeletedFictionComment from '../../../../../js/app/components/debate/brightMirror/deletedFictionComment';
import CircleAvatar from '../../../../../js/app/components/debate/brightMirror/circleAvatar';
import ToggleCommentButton from '../../../../../js/app/components/debate/common/toggleCommentButton';
import ReplyToCommentButton from '../../../../../js/app/components/debate/common/replyToCommentButton';
import FictionCommentForm from '../../../../../js/app/components/debate/brightMirror/fictionCommentForm';
import EditPostButton from '../../../../../js/app/components/debate/common/editPostButton';
import DeletePostButton from '../../../../../js/app/components/debate/common/deletePostButton';
// Type imports
import type { FictionCommentGraphQLProps } from '../../../../../js/app/components/debate/brightMirror/fictionComment';

// Import existing storybook data
import {
  defaultFictionComment,
  defaultFictionCommentGraphQL
} from '../../../../../js/app/stories/components/debate/brightMirror/fictionComment.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
// Temporary remove the storyshot because of an error related to the component TextareaAutosize: need fix
// Error message: TypeError: Cannot read property 'dispatchEvent' of null
// initStoryshots({
//   storyKindRegex: /^FictionComment$/
// });

configure({ adapter: new Adapter() });

// Mock utils functions
jest.mock('../../../../../js/app/utils/globalFunctions', () => ({
  getConnectedUserId: jest.fn(() => '1234567890'),
  isMobile: { any: jest.fn(() => false) },
  getIconPath: jest.fn(() => 'icons/path/avatar')
}));
jest.mock('../../../../../js/app/utils/permissions', () => ({ connectedUserCan: jest.fn(() => true) }));

describe('<FictionComment /> - with shallow', () => {
  let wrapper;
  let fictionComment: FictionCommentGraphQLProps;

  beforeEach(() => {
    fictionComment = {
      ...defaultFictionComment,
      ...defaultFictionCommentGraphQL,
      measureTreeHeight: jest.fn()
    };
    wrapper = shallow(<ShallowFictionComment {...fictionComment} />);
  });

  it('should render one CircleAvatar with default value', () => {
    expect(wrapper.find(CircleAvatar)).toHaveLength(1);
  });

  it('should display a "toggle comment" button', () => {
    expect(wrapper.find(ToggleCommentButton)).toHaveLength(1);
  });

  it('should display a "reply to comment" button when FictionCommentForm is hidden', () => {
    expect(wrapper.find(ReplyToCommentButton)).toHaveLength(1);
    expect(wrapper.find(FictionCommentForm)).toHaveLength(0);
  });

  it('should not display a "reply to comment" button when FictionCommentForm is displayed', () => {
    wrapper.setState({ showFictionCommentForm: true });
    expect(wrapper.find(ReplyToCommentButton)).toHaveLength(0);
    expect(wrapper.find(FictionCommentForm)).toHaveLength(1);
  });

  it('should not display a DeletedFictionComment component', () => {
    expect(wrapper.find(DeletedFictionComment)).toHaveLength(0);
  });
});

describe('<FictionComment /> - with mount', () => {
  let wrapper;
  let mocks;
  let fictionComment: FictionCommentGraphQLProps;

  describe('when loading is done without error', () => {
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        ...defaultFictionCommentGraphQL,
        measureTreeHeight: jest.fn(),
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should display the comment author fullname', () => {
      expect(wrapper.contains(defaultFictionCommentGraphQL.authorFullname)).toBe(true);
    });

    it('should display the parent comment author fullname', () => {
      expect(wrapper.contains(defaultFictionCommentGraphQL.parentPostAuthorFullname)).toBe(true);
    });

    it('should display the comment published date', () => {
      expect(wrapper.find(`time[dateTime="${defaultFictionCommentGraphQL.publishedDate}"]`)).toHaveLength(1);
      expect(wrapper.contains(defaultFictionCommentGraphQL.displayedPublishedDate)).toBe(true);
    });

    it('should not display the comment as edited', () => {
      expect(wrapper.contains(I18n.t('debate.thread.postEdited'))).toBe(false);
    });

    it('should display the comment content', () => {
      expect(wrapper.contains(defaultFictionCommentGraphQL.commentContent)).toBe(true);
    });

    it('should display the number of child comments', () => {
      expect(wrapper.contains(`${defaultFictionComment.numChildren} responses`)).toBe(true);
    });
  });

  describe('when authorFullname is null', () => {
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        ...defaultFictionCommentGraphQL,
        measureTreeHeight: jest.fn(),
        authorFullname: 'No author specified',
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should display "No author specified"', () => {
      expect(wrapper.contains('No author specified')).toBe(true);
    });
  });

  describe('when parentPostAuthorFullname is null', () => {
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        ...defaultFictionCommentGraphQL,
        measureTreeHeight: jest.fn(),
        parentPostAuthorFullname: 'No author specified',
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should display "No author specified"', () => {
      expect(wrapper.contains('No author specified')).toBe(true);
    });
  });

  describe('when getConnectedUserId match permission and authorUserId', () => {
    // getConnectedUserId mocked value is 1234567890
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        ...defaultFictionCommentGraphQL,
        authorUserId: 1234567890,
        measureTreeHeight: jest.fn(),
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should display a "Edit this message" button', () => {
      expect(wrapper.find(EditPostButton)).toHaveLength(1);
    });

    it('should display a "Delete this message" button', () => {
      expect(wrapper.find(DeletePostButton)).toHaveLength(1);
    });
  });

  describe('when getConnectedUserId does not match permission and authorUserId', () => {
    // getConnectedUserId mocked value is 1234567890 (as admin)
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        ...defaultFictionCommentGraphQL,
        authorUserId: 9876543210,
        measureTreeHeight: jest.fn(),
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should not display a "Edit this message" button', () => {
      expect(wrapper.find(EditPostButton)).toHaveLength(0);
    });

    it('should not display a "Delete this message" button', () => {
      expect(wrapper.find(DeletePostButton)).toHaveLength(1);
    });
  });

  describe('when modified is true', () => {
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        ...defaultFictionCommentGraphQL,
        measureTreeHeight: jest.fn(),
        modified: true,
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should display the comment as edited', () => {
      expect(wrapper.contains(I18n.t('debate.thread.postEdited'))).toBe(true);
    });
  });

  describe('when publicationState is DELETED_BY_USER', () => {
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        ...defaultFictionCommentGraphQL,
        publicationState: 'DELETED_BY_USER',
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should display a DeletedFictionComment component', () => {
      expect(wrapper.find(DeletedFictionComment)).toHaveLength(1);
    });
  });

  describe('when publicationState is DELETED_BY_ADMIN', () => {
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        ...defaultFictionCommentGraphQL,
        publicationState: 'DELETED_BY_ADMIN',
        // Below are the required input params for CommentQuery
        id: 'aaa',
        contentLocale: 'fr'
      };

      // Mock Apollo
      mocks = [
        {
          request: { query: CommentQuery },
          result: {
            data: fictionComment
          }
        }
      ];
      wrapper = mount(
        <MockedProvider mocks={mocks}>
          <FictionComment {...fictionComment} />
        </MockedProvider>
      );
    });

    it('should display a DeletedFictionComment component', () => {
      expect(wrapper.find(DeletedFictionComment)).toHaveLength(1);
    });
  });
});