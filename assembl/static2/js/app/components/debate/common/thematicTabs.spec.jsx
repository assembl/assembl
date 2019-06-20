// @flow
import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import ThematicTabs from './thematicTabs';

configure({ adapter: new Adapter() });

describe('<InstructionsText /> - with shallow', () => {
  let wrapper;
  let props;

  beforeEach(() => {
    props = {
      summary: null,
      isMobile: false,
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

  it('should render Summary tab if summary is passed', () => {
    wrapper.setProps({
      summary: 'A summary'
    });
    expect(wrapper.find(Tab)).toHaveLength(2);
  });

  it('should render regular mindmanager link in summary if mobile', () => {
    wrapper.setProps({
      isMobile: true,
      summary:
        'A summary with a link <a href="https://share.mindmanager.com/#publish/e_lZRkeg4pFdGATyzqTwXVHzNpOCHwR1cDRy4tOQ" title="Lien vers le mindmanager">Lien vers le mindmanager</a>'
    });
    expect(wrapper.find('.iframed')).toHaveLength(0);
    expect(wrapper.find('.linkified')).toHaveLength(1);
  });

  it('should render iframed mindmanager link in summary if not mobile', () => {
    wrapper.setProps({
      isMobile: false,
      summary:
        'A summary with a link <a href="https://share.mindmanager.com/#publish/e_lZRkeg4pFdGATyzqTwXVHzNpOCHwR1cDRy4tOQ" title="Lien vers le mindmanager">Lien vers le mindmanager</a>'
    });
    expect(wrapper.find('.iframed')).toHaveLength(1);
    expect(wrapper.find('.linkified')).toHaveLength(0);
  });
});