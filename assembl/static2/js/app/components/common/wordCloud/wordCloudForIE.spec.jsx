// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import WordCloudForIE from './wordCloudForIE';
import { defaultWordCloudForIEProps } from './wordCloudForIE.stories';

initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|WordCloudForIE$/
});

configure({ adapter: new Adapter() });

describe('<WordCloudForIE /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<WordCloudForIE {...defaultWordCloudForIEProps} />);
  });

  it('should render keywords in div', () => {
    expect(wrapper.find('div')).toHaveLength(2);
  });

  it('should not render keywords', () => {
    const props = { keywords: [] };
    wrapper = shallow(<WordCloudForIE {...props} />);
  });
});