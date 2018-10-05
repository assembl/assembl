// @flow
import React from 'react';
import { Link } from 'react-router';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import ReplyToCommentButton from '../../../../../js/app/components/debate/common/replyToCommentButton';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^ReplyToCommentButton$/
});

configure({ adapter: new Adapter() });

describe('<ReplyToCommentButton /> - with mount', () => {
  let wrapper;

  beforeEach(() => {
    // const replyToCommentButtonProps: ReplyToCommentButtonProps = {};
    // wrapper = mount(<ReplyToCommentButton {...replyToCommentButtonProps} />);
    wrapper = mount(<ReplyToCommentButton />);
  });

  it('should render one Link with a reply icon embedded', () => {
    expect(wrapper.find(Link)).toHaveLength(1);
    expect(wrapper.find('span [className="assembl-icon-back-arrow"]')).toHaveLength(1);
  });
});