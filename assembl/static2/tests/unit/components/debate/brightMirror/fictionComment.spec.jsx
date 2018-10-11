// @flow
import React from 'react';
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
import CircleAvatar from '../../../../../js/app/components/debate/brightMirror/circleAvatar';
import ToggleCommentButton from '../../../../../js/app/components/debate/common/toggleCommentButton';
import ReplyToCommentButton from '../../../../../js/app/components/debate/common/replyToCommentButton';
import FictionCommentForm from '../../../../../js/app/components/debate/brightMirror/fictionCommentForm';
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

describe('<FictionComment /> - with shallow', () => {
  let wrapper;
  let fictionComment: FictionCommentGraphQLProps;

  beforeEach(() => {
    fictionComment = {
      ...defaultFictionComment,
      ...defaultFictionCommentGraphQL
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
      expect(wrapper.contains(defaultFictionCommentGraphQL.parentCommentAuthorFullname)).toBe(true);
    });

    it('should display the comment published date', () => {
      expect(wrapper.find(`time [dateTime="${defaultFictionCommentGraphQL.publishedDate}"]`)).toHaveLength(1);
      expect(wrapper.contains(defaultFictionCommentGraphQL.displayedPublishedDate)).toBe(true);
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
        authorFullname: '',
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

    it('should display "no author specified"', () => {
      expect(wrapper.contains('No author specified')).toBe(true);
    });
  });

  describe('when parentCommentAuthorFullname is null', () => {
    beforeEach(() => {
      fictionComment = {
        ...defaultFictionComment,
        ...defaultFictionCommentGraphQL,
        parentCommentAuthorFullname: '',
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

    it('should display "no author specified"', () => {
      expect(wrapper.contains('No author specified')).toBe(true);
    });
  });
});