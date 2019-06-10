// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';

/* eslint-enable */

import { SemanticAnalysis } from '../semanticAnalysis';
import { SemanticAnalysisForDiscussion } from './semanticAnalysisForDiscussion';
import type { Props as SemanticAnalysisForDiscussionProps } from './semanticAnalysisForDiscussion';

configure({ adapter: new Adapter() });

describe('<SemanticAnalysisForDiscussion /> - with shallow', () => {
  let wrapper;
  let semanticAnalysisForDiscussionProps: SemanticAnalysisForDiscussionProps;

  beforeEach(() => {
    semanticAnalysisForDiscussionProps = {
      semanticAnalysisForDiscussionData: {
        id: '1',
        nlpSentiment: {
          positive: 0.630824,
          negative: 0,
          count: 1
        },
        title: 'Lorem',
        topKeywords: [
          {
            count: 1,
            score: 0.955221,
            value: 'Donec tempor'
          },
          {
            count: 1,
            score: 0.825581,
            value: 'quam viverra aliquam elementum'
          }
        ]
      }
    };
    wrapper = shallow(<SemanticAnalysisForDiscussion {...semanticAnalysisForDiscussionProps} />);
  });

  it('should render a div with semantic-analysis-container class', () => {
    expect(wrapper.find('div[className="semantic-analysis-container"]')).toHaveLength(1);
  });

  it('should render a banner', () => {
    expect(wrapper.find('div[className="banner"]')).toHaveLength(1);
  });

  it('should render a SemanticAnalysis component', () => {
    expect(wrapper.find(SemanticAnalysis)).toHaveLength(1);
  });
});