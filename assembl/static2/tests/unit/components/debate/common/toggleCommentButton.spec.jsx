// @flow
import React from 'react';
import { Link } from 'react-router';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import ToogleCommentButton from '../../../../../js/app/components/debate/common/toggleCommentButton';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^ToggleCommentButton$/
});

configure({ adapter: new Adapter() });

describe('<ToggleCommentButton /> - with mount', () => {
  let wrapper;

  beforeEach(() => {
    // const toggleCommentButtonProps: ToggleCommentButtonProps = {};
    // wrapper = mount(<ToogleCommentButton {...toggleCommentButtonProps} />);
    wrapper = mount(<ToogleCommentButton />);
  });

  it('should render one Link with a reply icon embedded', () => {
    expect(wrapper.find(Link)).toHaveLength(1);
    expect(wrapper.find('span [className="assembl-icon-down-open"]')).toHaveLength(1);
  });
});