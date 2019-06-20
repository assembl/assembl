// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
// Components imports
import DeletedFictionComment from '../../../../../js/app/components/debate/brightMirror/deletedFictionComment';
import CircleAvatar from '../../../../../js/app/components/debate/brightMirror/circleAvatar';
import ToggleCommentButton from '../../../../../js/app/components/debate/common/toggleCommentButton';
// Type imports
import type { DeletedFictionCommentProps } from '../../../../../js/app/components/debate/brightMirror/deletedFictionComment';

// Import existing storybook data
import { defaultDeletedFictionComment } from '../../../../../js/app/stories/components/debate/brightMirror/deletedFictionComment.stories'; // eslint-disable-line max-len

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^DeletedFictionComment$/
});

configure({ adapter: new Adapter() });

describe('<DeletedFictionComment /> - with shallow', () => {
  let wrapper;
  let deletedFictionComment: DeletedFictionCommentProps;

  beforeEach(() => {
    deletedFictionComment = {
      ...defaultDeletedFictionComment
    };
    wrapper = shallow(<DeletedFictionComment {...deletedFictionComment} />);
  });

  it('should render one default CircleAvatar', () => {
    expect(wrapper.find(CircleAvatar)).toHaveLength(1);
  });

  it('should display the number of child comments', () => {
    expect(wrapper.find('Translate[value="debate.thread.postDeletedByUser"]')).toHaveLength(1);
  });

  it('should display a "toggle comment" button', () => {
    expect(wrapper.find(ToggleCommentButton)).toHaveLength(1);
  });

  it('should display the default deleted message by author', () => {
    expect(wrapper.find('Translate[value="debate.thread.postDeletedByUser"]')).toHaveLength(1);
  });

  it('should display the default deleted message by admin', () => {
    wrapper.setProps({ isDeletedByAuthor: false });
    expect(wrapper.find('Translate[value="debate.thread.postDeletedByAdmin"]')).toHaveLength(1);
  });
});