// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import ResponsiveWordCloud from './responsiveWordCloud';
import { defaultResponsiveWordCloudProps } from './responsiveWordCloud.stories';

configure({ adapter: new Adapter() });

describe('<ResponsiveWordCloud /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ResponsiveWordCloud {...defaultResponsiveWordCloudProps} />);
  });

  it('should render a <ResizeAware />', () => {
    expect(wrapper.find('ResizeAware')).toHaveLength(1);
  });
});