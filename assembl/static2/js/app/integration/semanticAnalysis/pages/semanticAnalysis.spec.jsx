// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import SemanticAnalysis from './semanticAnalysis';
import Loader from '../../../components/common/loader/loader';
import ToolbarSlider from '../../../components/common/toolbarSlider/toolbarSlider';
import TitleWithTooltip from '../../../components/common/titleWithTooltip/titleWithTooltip';
import ResponsiveWordCloud from '../../../components/common/wordCloud/responsiveWordCloud';

configure({ adapter: new Adapter() });

describe('<SemanticAnalysis /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SemanticAnalysis />);
  });

  it('should render a div with semantic-analysis as className', () => {
    expect(wrapper.find('div [className="semantic-analysis"]')).toHaveLength(1);
  });

  it('should render 2 Loader component', () => {
    expect(wrapper.find(Loader)).toHaveLength(2);
  });

  it('should render a ToolbarSlider component', () => {
    expect(wrapper.find(ToolbarSlider)).toHaveLength(1);
  });

  it('should render a TitleWithTooltip component', () => {
    expect(wrapper.find(TitleWithTooltip)).toHaveLength(1);
  });

  it('should render a ResponsiveWordCloud component', () => {
    expect(wrapper.find(ResponsiveWordCloud)).toHaveLength(1);
  });
});