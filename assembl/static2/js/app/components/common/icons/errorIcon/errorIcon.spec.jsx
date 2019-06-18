// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import ErrorIcon from './errorIcon';

configure({ adapter: new Adapter() });

describe('<ErrorIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ErrorIcon />);
  });

  it('should render an error icon', () => {
    expect(wrapper.find('g[className="arrow1"]')).toHaveLength(1);
    expect(wrapper.find('g[className="arrow2"]')).toHaveLength(1);
    expect(wrapper.find('text[className="mark"]')).toHaveLength(1);
  });
});