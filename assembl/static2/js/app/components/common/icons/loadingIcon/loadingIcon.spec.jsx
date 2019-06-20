// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import LoadingIcon from './loadingIcon';

configure({ adapter: new Adapter() });

describe('<LoadingIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<LoadingIcon />);
  });

  it('should render a loading icon', () => {
    expect(wrapper.find('svg[className="icon spinner"]')).toHaveLength(1);
  });
});