// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import { SemanticAnalysis } from './semanticAnalysis';
import Description from '../../../components/common/description/description';
import ToolbarSlider from '../../../components/common/toolbarSlider/toolbarSlider';
import ResponsiveWordCloud from '../../../components/common/wordCloud/responsiveWordCloud';
import KeywordInfo from '../../../components/common/keywordInfo/keywordInfo';
import SentimentBar from '../../../components/common/sentimentBar/sentimentBar';
import WordCountInformation from '../../../components/common/wordCountInformation/wordCountInformation';

configure({ adapter: new Adapter() });

describe('<SemanticAnalysis /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SemanticAnalysis />);
  });

  it('should render a level-1 Title component if data loaded', () => {
    expect(wrapper.find('Title[level=1]')).toHaveLength(1);
  });

  it('should render a Description component if data loaded', () => {
    expect(wrapper.find(Description)).toHaveLength(1);
  });

  it('should render a WordCountInformation component if data loaded', () => {
    expect(wrapper.find(WordCountInformation)).toHaveLength(1);
  });

  it('should render a ResponsiveWordCloud component if data loaded', () => {
    expect(wrapper.find(ResponsiveWordCloud)).toHaveLength(1);
  });

  it('should render 2 level-2 TitleWithTooltip components if data loaded', () => {
    expect(wrapper.find('TitleWithTooltip[level=2]')).toHaveLength(2);
  });

  it('should render a level-2 Title component if data loaded', () => {
    expect(wrapper.find('Title[level=2]')).toHaveLength(1);
  });

  it('should render a KeywordInfo component if data loaded', () => {
    expect(wrapper.find(KeywordInfo)).toHaveLength(1);
  });

  it('should render a ToolbarSlider component if data loaded', () => {
    expect(wrapper.find(ToolbarSlider)).toHaveLength(1);
  });

  it('should render a SentimentBar component if data loaded', () => {
    expect(wrapper.find(SentimentBar)).toHaveLength(1);
  });
});