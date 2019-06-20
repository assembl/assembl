// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import SentimentBar from './sentimentBar';
import { defaultSentimentBarProps } from './sentimentBar.stories';

initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|SentimentBar$/
});

configure({ adapter: new Adapter() });

describe('<SentimentBar /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SentimentBar {...defaultSentimentBarProps} />);
  });

  it('should render an image of a sentimentBar', () => {
    expect(wrapper.find('SentimentBarIcon')).toHaveLength(1);
  });

  it('should render the value (with 2 digits)', () => {
    expect(wrapper.contains(defaultSentimentBarProps.value.toFixed(2))).toBe(true);
  });

  it('should render an error message if value is incorrect (<0 or >1)', () => {
    wrapper.setProps({ value: -1 });
    expect(wrapper.find('p[className="error"]')).toHaveLength(1);
    wrapper.setProps({ value: 2 });
    expect(wrapper.find('p[className="error"]')).toHaveLength(1);
  });
});