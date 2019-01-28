// @flow
import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';

import InstructionsText from '../../../../../js/app/components/debate/brightMirror/instructionsText';
import { customInstructionsText } from '../../../../../js/app/stories/components/debate/brightMirror/instructionsText.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^InstructionsText$/
});

configure({ adapter: new Adapter() });

describe('<InstructionsText /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<InstructionsText {...customInstructionsText} />);
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