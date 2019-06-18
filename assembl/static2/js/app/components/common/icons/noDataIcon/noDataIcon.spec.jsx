// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import NoDataIcon from './noDataIcon';

configure({ adapter: new Adapter() });

describe('<NotEnoughDataIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<NoDataIcon />);
  });

  it('should render an error icon', () => {
    expect(wrapper.find('svg')).toHaveLength(1);
  });
});