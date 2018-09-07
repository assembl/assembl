// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

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

  it('should render title', () => {
    expect(wrapper.find('h3 [className="announcement-title-text dark-title-1"]')).toHaveLength(1);
  });

  it('should render body', () => {
    expect(wrapper.find('Col [className="announcement-media col-md-push-2"]')).toHaveLength(1);
  });
});