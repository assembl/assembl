// @flow
import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import ThematicTabs from './thematicTabs';

configure({ adapter: new Adapter() });

describe('<InstructionsText /> - with shallow', () => {
  let wrapper;
  let props;

  beforeEach(() => {
    props = {
      semanticAnalysisForThematicData: {
        id: '1234',
        nlpSentiment: {
          positive: null,
          negative: null,
          count: 0
        },
        title: 'Bright',
        topKeywords: []
      }
    };
    wrapper = shallow(<ThematicTabs {...props} />);
  });

  it('should render a Navbar', () => {
    expect(wrapper.find(Tabs)).toHaveLength(1);
  });

  it('should render a Tab', () => {
    expect(wrapper.find(Tab)).toHaveLength(1);
  });

  it('should render 2 Tab if data for SemanticAnalysis is passed', () => {
    wrapper.setProps({
      semanticAnalysisForThematicData: {
        id: '1234',
        nlpSentiment: {
          positive: 1,
          negative: 0,
          count: 1
        },
        title: 'Test',
        topKeywords: [
          {
            count: null,
            score: 11.065457,
            value: 'Lorem'
          }
        ]
      }
    });
    expect(wrapper.find(Tab)).toHaveLength(2);
  });
});