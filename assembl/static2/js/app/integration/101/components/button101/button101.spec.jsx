// @flow
import React from 'react';
import { Button } from 'react-bootstrap';
/* eslint-disable */
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import Button101 from './button101';
// Import dummy data from the stories file instead of creating or duplicating a set of data
import {
  dangerButtonWithCustomLabel,
  disabledButton,
  actions
} from './button101.stories';

configure({ adapter: new Adapter() });

describe('<Button101 /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    // Mock actions
    actions.defaultButtonTappedHandler = jest.fn();
    actions.dangerButtonTappedHandler = jest.fn();

    wrapper = shallow(<Button101
      buttonTappedHandler={actions.defaultButtonTappedHandler}
    />);
  });

  it('should render one info Button with default values', () => {
    expect(wrapper.find(Button)).toHaveLength(1);
    expect(wrapper.find('[bsStyle=\'info\']')).toHaveLength(1);
    expect(wrapper.contains('Bluenove')).toBe(true);
  });

  it('should render one danger Button with custom values', () => {
    wrapper.setProps({ ...dangerButtonWithCustomLabel });

    expect(wrapper.find(Button)).toHaveLength(1);
    expect(wrapper.find('[bsStyle=\'danger\']')).toHaveLength(1);
    expect(wrapper.contains('Custom label')).toBe(true);
  });

  it('should render one disabled Button', () => {
    wrapper.setProps({ ...disabledButton });
    expect(wrapper.find(Button)).toHaveLength(1);
  });
});

describe('<Button101 /> - with mount', () => {
  let wrapper;

  beforeEach(() => {
    // Mock actions
    actions.defaultButtonTappedHandler = jest.fn();
    actions.dangerButtonTappedHandler = jest.fn();

    wrapper = mount(<Button101
      buttonTappedHandler={actions.defaultButtonTappedHandler}
    />);
  });

  it('should render one Button that can be clicked', () => {
    wrapper.simulate('click');
    expect(actions.defaultButtonTappedHandler).toHaveBeenCalledTimes(1);
  });

  it('should render one Button that cannot be clicked', () => {
    wrapper.setProps({ ...disabledButton });
    wrapper.simulate('click');
    expect(actions.defaultButtonTappedHandler).toHaveBeenCalledTimes(0);
  });
});