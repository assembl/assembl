// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import TagOnPost from './tagOnPost';

configure({ adapter: new Adapter() });

describe('<TagOnPost /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<TagOnPost />);
  });

  it('should render a div', () => {
    expect(wrapper.find('div')).toHaveLength(7);
  });
});