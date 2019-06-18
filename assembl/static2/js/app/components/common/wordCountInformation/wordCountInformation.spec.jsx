// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import WordCountInformation from './wordCountInformation';
import type { Props as WordCountInformationProps } from './wordCountInformation';
import { defaultWordCountInformationProps } from './wordCountInformation.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|WordCountInformation$/
});

configure({ adapter: new Adapter() });

describe('<WordCountInformation /> - with shallow', () => {
  let wrapper;
  let wordCountInformationProps: WordCountInformationProps;

  beforeEach(() => {
    wordCountInformationProps = { ...defaultWordCountInformationProps };
    wrapper = shallow(<WordCountInformation {...wordCountInformationProps} />);
  });

  it('should use description component', () => {
    expect(wrapper.find('Description')).toHaveLength(1);
  });

  it('should use translate component', () => {
    expect(wrapper.find('Translate')).toHaveLength(1);
  });
});