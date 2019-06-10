// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import SentimentBarIcon from './sentimentBarIcon';
import type { Props as SentimentBarIconProps } from './sentimentBarIcon';

configure({ adapter: new Adapter() });

describe('<SentimentBarIcon /> - with shallow', () => {
  let wrapper;
  let sentimentBarIcon: SentimentBarIconProps;

  beforeEach(() => {
    sentimentBarIcon = { level: 2 };
    wrapper = shallow(<SentimentBarIcon {...sentimentBarIcon} />);
  });

  it('should render a loading icon', () => {
    expect(wrapper.find('svg[className="icon"]')).toHaveLength(1);
  });
});