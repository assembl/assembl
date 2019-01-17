// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import ResponsiveWordcloud from './responsiveWordcloud';
import { defaultResponsiveWordcloudProps } from './responsiveWordcloud.stories';

configure({ adapter: new Adapter() });

describe('<ResponsiveWordcloud /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ResponsiveWordcloud {...defaultResponsiveWordcloudProps} />);
  });

  it('should render a <ResizeAware />', () => {
    expect(wrapper.find('ResizeAware')).toHaveLength(1);
  });
});