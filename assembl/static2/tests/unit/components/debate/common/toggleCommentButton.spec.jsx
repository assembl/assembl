// @flow
import React from 'react';
import { Link } from 'react-router';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import ToogleCommentButton from '../../../../../js/app/components/debate/common/toggleCommentButton';

// Import existing storybook data
import { defaultToggleCommentButton } from '../../../../../js/app/stories/components/debate/common/toggleCommentButton.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^ToggleCommentButton$/
});

configure({ adapter: new Adapter() });

describe('<ToggleCommentButton /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ToogleCommentButton {...defaultToggleCommentButton} />);
  });

  it('should render one Link with a expanded icon embedded', () => {
    expect(wrapper.find(Link)).toHaveLength(1);
    expect(wrapper.find('span[className="assembl-icon-up-open"]')).toHaveLength(1);
  });

  it('should render one collapse icon when isExpanded is false', () => {
    wrapper.setProps({ isExpanded: false });
    expect(wrapper.find('span[className="assembl-icon-down-open"]')).toHaveLength(1);
  });

  it('should execute onClickHandler when clicking on the component', () => {
    const onClickHandler = jest.fn();
    wrapper.setProps({ onClickCallback: onClickHandler });
    wrapper.find(Link).simulate('click');

    expect(onClickHandler).toHaveBeenCalledTimes(1);
  });
});