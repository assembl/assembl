// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import SideCommentBadge from '../../../../../../js/app/components/debate/brightMirror/sideComment/sideCommentBadge';
import { defaultSideCommentBadge } from '../../../../../../js/app/stories/components/debate/brightMirror/sideComment/sideCommentBadge.stories'; // eslint-disable-line max-len

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^SideCommentBadge$/
});

configure({ adapter: new Adapter() });

describe('<SideCommentBadge /> - default with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SideCommentBadge {...defaultSideCommentBadge} />);
  });

  it('should render icon', () => {
    expect(wrapper.find('span[className="assembl-icon-suggest"]')).toHaveLength(1);
  });

  it('should render number of comments', () => {
    expect(wrapper.find('div[className="badge-total"]')).toHaveLength(1);
  });
});