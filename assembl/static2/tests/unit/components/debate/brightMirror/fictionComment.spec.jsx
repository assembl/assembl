// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import FictionComment from '../../../../../js/app/components/debate/brightMirror/fictionComment';
import CircleAvatar from '../../../../../js/app/components/debate/brightMirror/circleAvatar';
import ReplyToCommentButton from '../../../../../js/app/components/debate/common/replyToCommentButton';
import type { FictionCommentProps } from '../../../../../js/app/components/debate/brightMirror/fictionComment';

// Import existing storybook data
import { defaultFictionComment } from '../../../../../js/app/stories/components/debate/brightMirror/fictionComment.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionComment$/
});

configure({ adapter: new Adapter() });

describe('<FictionComment /> - with shallow', () => {
  let wrapper;
  let fictionComment: FictionCommentProps;

  beforeEach(() => {
    fictionComment = { ...defaultFictionComment };
    wrapper = shallow(<FictionComment {...fictionComment} />);
  });

  it('should render one CircleAvatar with default value', () => {
    expect(wrapper.find(CircleAvatar)).toHaveLength(1);
  });

  it('should display the comment author fullname', () => {
    expect(wrapper.contains(defaultFictionComment.authorFullname)).toBe(true);
  });

  it('should display "no author specified" when authorFullname is null', () => {
    wrapper.setProps({ authorFullname: '' });
    expect(wrapper.contains('no author specified')).toBe(true);
  });

  it('should display the comment published date', () => {
    expect(wrapper.find(`time [dateTime="${defaultFictionComment.publishedDate}"]`)).toHaveLength(1);
    expect(wrapper.contains(defaultFictionComment.displayedPublishedDate)).toBe(true);
  });

  it('should display the comment content', () => {
    expect(wrapper.contains(defaultFictionComment.commentContent)).toBe(true);
  });

  it('should display the number of child comments', () => {
    expect(wrapper.contains(defaultFictionComment.numberOfChildComments)).toBe(true);
  });

  it('should display a "reply to comment" button', () => {
    expect(wrapper.find(ReplyToCommentButton)).toHaveLength(1);
  });
});