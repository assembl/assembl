// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import SideCommentAnchor from '../../../../../../js/app/components/debate/brightMirror/sideComment/sideCommentAnchor';
import { defaultSideCommentAnchor } from '../../../../../../js/app/stories/components/debate/brightMirror/sideComment/sideCommentAnchor.stories'; // eslint-disable-line max-len

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^SideCommentAnchor$/
});

configure({ adapter: new Adapter() });

describe('<SideCommentAnchor /> - default with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SideCommentAnchor {...defaultSideCommentAnchor} />);
  });

  it('should render suggest text', () => {
    expect(wrapper.find('span[className="suggest"]')).toHaveLength(1);
  });
});