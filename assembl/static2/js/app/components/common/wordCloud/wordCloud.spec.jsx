// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import WordCloud from './wordCloud';

configure({ adapter: new Adapter() });

let props = {
  keywords: []
};

describe('<WordCloud /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<WordCloud {...props} />);
  });

  it('should render no <ReactWordCloud /> if no data is passed', () => {
    expect(wrapper.find('WordCloud')).toHaveLength(0);
  });

  it('should render render a <ReactWordCloud /> if data is passed', () => {
    props = { keywords: [{ value: 'text', score: 0.9, count: 5 }] };
    wrapper = shallow(<WordCloud {...props} />);
    expect(wrapper.find('WordCloud')).toHaveLength(1);
  });
});