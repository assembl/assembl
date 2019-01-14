// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import Description from './description';

configure({ adapter: new Adapter() });

describe('<Description /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<Description />);
  });

  it('should render a unique div which has a classname', () => {
    expect(wrapper.find('div [className]')).toHaveLength(1);
  });

  it('should render children props', () => {
    wrapper.setProps({ children: <p className="my-child" /> });
    expect(wrapper.contains(<p className="my-child" />)).toEqual(true);
  });
});