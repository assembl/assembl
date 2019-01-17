// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import SentimentBar from './sentimentBar';

const defaultSentimentBarProps = { value: 0.5755 };

configure({ adapter: new Adapter() });

describe('<SentimentBar /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SentimentBar {...defaultSentimentBarProps} />);
  });

  it('should render an image of a sentimentBar', () => {
    expect(wrapper.find('img')).toHaveLength(1);
  });

  it('should render the value (with 2 digits)', () => {
    expect(wrapper.contains(defaultSentimentBarProps.value.toFixed(2))).toBe(true);
  });
});