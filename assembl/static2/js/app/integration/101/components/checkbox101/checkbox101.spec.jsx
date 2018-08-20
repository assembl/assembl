// @flow
import React from 'react';
/* eslint-disable */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import Checkbox101 from './checkbox101';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^Checkbox101$/
});

configure({ adapter: new Adapter() });

describe('<Checkbox101 /> - with shallow', () => {
  let wrapper;
  let onChangeHandler;

  beforeEach(() => {
    // Mock actions
    onChangeHandler = jest.fn();

    wrapper = shallow(<Checkbox101
      onChangeHandler={onChangeHandler}
    />);
  });

  it('should render one checkbox with a default label', () => {
    const defaultLabel = 'Default';

    expect(wrapper.find('input [type=\'checkbox\']')).toHaveLength(1);
    expect(wrapper.find('label').text()).toEqual(defaultLabel);
  });

  it('should render one checkbox with a custom label', () => {
    const customLabel = 'Custom Label';
    wrapper.setProps({ label: customLabel });

    expect(wrapper.find('input [type=\'checkbox\']')).toHaveLength(1);
    expect(wrapper.find('label').text()).toEqual(customLabel);
  });

  it('should render one checkbox that can be checked', () => {
    wrapper.find('input [type=\'checkbox\']').simulate('change');

    expect(onChangeHandler).toHaveBeenCalledTimes(1);
  });

  it('should render one unchecked checkbox by default', () => {
    expect(wrapper.find('input [checked=false]')).toHaveLength(1);
  });

  it('should render one checked checkbox when isDone is true', () => {
    wrapper.setProps({ isDone: true });

    expect(wrapper.find('input [checked=true]')).toHaveLength(1);
  });
});