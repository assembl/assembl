// @flow
import React from 'react';
/* eslint-disable */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import Checkbox101 from './checkbox101';

configure({ adapter: new Adapter() });

describe('<Checkbox101 /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Checkbox101 />);
  });

  it('should render one checkbox', () => {
    expect(wrapper.find('input [type=\'checkbox\']')).toHaveLength(1);
    expect(wrapper.contains('Default')).toBe(true);
  });

  it('should render one checked checkbox', () => {
    wrapper.setProps({ checked: true });

    expect(wrapper.find('input [type=\'checkbox\'] [checked=true]')).toHaveLength(1);
  });

  it('should render one checkbox with a custom label', () => {
    const customLabel = 'Custom Label';
    wrapper.setProps({ label: customLabel });

    expect(wrapper.contains(customLabel)).toBe(true);
  });
});