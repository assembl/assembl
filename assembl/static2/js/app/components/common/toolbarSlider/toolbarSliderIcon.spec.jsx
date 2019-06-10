// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import ToolbarSliderIcon from './toolbarSliderIcon';

configure({ adapter: new Adapter() });

describe('<ToolbarSliderIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ToolbarSliderIcon />);
  });

  it('should render a slider cursor image', () => {
    expect(wrapper.find('img')).toHaveLength(1);
  });

  it('should render the value passed as props', () => {
    wrapper.setProps({ value: 'valuePassed' });
    expect(wrapper.text()).toEqual('valuePassed');
  });

  it('should render the value in a paragraph with className passed as props', () => {
    wrapper.setProps({ textClassName: 'classNamePassed' });
    expect(wrapper.find('p[className="classNamePassed"]')).toHaveLength(1);
  });
});