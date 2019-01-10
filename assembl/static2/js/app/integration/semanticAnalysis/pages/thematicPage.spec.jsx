// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import ThematicPage from './thematicPage';

configure({ adapter: new Adapter() });

describe('<ThematicPage /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ThematicPage />);
  });

  it('should render a h1', () => {
    expect(wrapper.find('h1')).toHaveLength(1);
  });
});