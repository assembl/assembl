// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import ResponsiveWordcloud from './responsiveWordcloud';

configure({ adapter: new Adapter() });

const propsDefault = {
  keywords: [{ text: 'text', relevance: 0.9, count: 5 }]
};

describe('<ResponsiveWordcloud /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ResponsiveWordcloud {...propsDefault} />);
  });

  it('should render a <ResizeAware />', () => {
    expect(wrapper.find('ResizeAware')).toHaveLength(1);
  });
});