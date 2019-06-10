// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import CommentHelperButton from '../../../../../js/app/components/debate/common/commentHelperButton';

// Import existing storybook data
import { defaultCommentHelperButtonProps } from '../../../../../js/app/stories/components/debate/common/commentHelperButton.stories'; // eslint-disable-line max-len

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^CommentHelperButton$/
});

configure({ adapter: new Adapter() });

describe('<CommentHelperButton /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<CommentHelperButton {...defaultCommentHelperButtonProps} />);
  });

  it('should render one Button with a suggest icon embedded', () => {
    expect(wrapper.find(Button)).toHaveLength(1);
    expect(wrapper.find('span[className="assembl-icon-suggest"]')).toHaveLength(1);
  });

  it('should execute onClickHandler when clicking on the component', () => {
    const onClickHandler = jest.fn();
    wrapper.setProps({ onClickCallback: onClickHandler });
    wrapper.find(Button).simulate('click');
    expect(onClickHandler).toHaveBeenCalledTimes(1);
  });
});