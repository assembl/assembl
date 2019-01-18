// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import ResultInformation from './resultInformation';
import type { Props as ResultInformationProps } from './resultInformation';
import { defaultResultInformationProps } from './resultInformation.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^ResultInformation$/
});

configure({ adapter: new Adapter() });

describe('<ResultInformation /> - with shallow', () => {
  let wrapper;
  let resultInformationProps: ResultInformationProps;

  beforeEach(() => {
    resultInformationProps = { ...defaultResultInformationProps };
    wrapper = shallow(<ResultInformation {...resultInformationProps} />);
  });

  it('should use description component', () => {
    expect(wrapper.find('Description')).toHaveLength(1);
  });

  it('should use translate component', () => {
    expect(wrapper.find('Translate')).toHaveLength(1);
  });
});