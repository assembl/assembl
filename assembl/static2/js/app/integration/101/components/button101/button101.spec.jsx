// @flow
import React from 'react';
/* eslint-disable */
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import Button101 from './button101';

configure({ adapter: new Adapter() });

describe('<Button101 /> - with shallow', () => {
  let wrapper;
  let onClickHandler;

  beforeEach(() => {
    // Mock actions
    onClickHandler = jest.fn();

    wrapper = shallow(<Button101
      onClickHandler={onClickHandler}
    />);
  });

  it('should render one info Button with default values', () => {
    expect(wrapper.find('Button [bsStyle=\'info\']')).toHaveLength(1);
  });

  it('should render one danger Button with custom values', () => {
    const customButtonLabel = 'Custom Label';
    wrapper.setProps({
      label: customButtonLabel,
      type: 'danger'
    });

    expect(wrapper.find('Button [bsStyle=\'danger\']')).toHaveLength(1);
    expect(wrapper.contains(customButtonLabel)).toBe(true);
  });

  it('should render one disabled Button', () => {
    wrapper.setProps({ isDisabled: true });
    expect(wrapper.find('Button [disabled=true]')).toHaveLength(1);
  });
});

describe('<Button101 /> - with mount', () => {
  let wrapper;
  let onClickHandler;

  beforeEach(() => {
    // Mock actions
    onClickHandler = jest.fn();

    wrapper = mount(<Button101
      onClickHandler={onClickHandler}
    />);
  });

  it('should render one Button that can be clicked', () => {
    wrapper.simulate('click');
    expect(onClickHandler).toHaveBeenCalledTimes(1);
  });

  it('should render one Button that cannot be clicked', () => {
    wrapper.setProps({ isDisabled: true });
    wrapper.simulate('click');
    expect(onClickHandler).toHaveBeenCalledTimes(0);
  });
});