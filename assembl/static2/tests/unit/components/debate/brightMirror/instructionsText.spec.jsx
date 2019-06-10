// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
// Component imports
import InstructionsText from '../../../../../js/app/components/debate/brightMirror/instructionsText';
import { customInstructionsText } from '../../../../../js/app/stories/components/debate/brightMirror/instructionsText.stories';
import ThematicTabs from '../../../../../js/app/components/debate/common/thematicTabs';

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

  it('should render a ThematicTabs', () => {
    expect(wrapper.find(ThematicTabs)).toHaveLength(1);
  });
});