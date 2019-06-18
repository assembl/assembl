// @flow
import React from 'react';
import { Link } from 'react-router';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import ReplyToCommentButton from '../../../../../js/app/components/debate/common/replyToCommentButton';
import ResponsiveOverlayTrigger from '../../../../../js/app/components/common/responsiveOverlayTrigger';

// Import existing storybook data
import { defaultReplyToCommentButton } from '../../../../../js/app/stories/components/debate/common/replyToCommentButton.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^ReplyToCommentButton$/
});

configure({ adapter: new Adapter() });

describe('<ReplyToCommentButton /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ReplyToCommentButton {...defaultReplyToCommentButton} />);
  });

  it('should render one Link with a reply icon embedded with a tooltip', () => {
    expect(wrapper.find(Link)).toHaveLength(1);
    expect(wrapper.find(ResponsiveOverlayTrigger)).toHaveLength(1);
    expect(wrapper.find('span[className="assembl-icon-back-arrow"]')).toHaveLength(1);
  });

  it('should execute onClickHandler when clicking on the component', () => {
    const onClickHandler = jest.fn();
    wrapper.setProps({ onClickCallback: onClickHandler });
    wrapper.find(Link).simulate('click');

    expect(onClickHandler).toHaveBeenCalledTimes(1);
  });
});