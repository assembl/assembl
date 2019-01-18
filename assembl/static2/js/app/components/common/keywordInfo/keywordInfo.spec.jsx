// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import KeywordInfo from './keywordInfo';

configure({ adapter: new Adapter() });

const defaultKeywordInfoProps = {
  keyword: {
    text: 'test',
    count: 5,
    relevance: 0.85
  }
};

describe('<KeywordInfo /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<KeywordInfo {...defaultKeywordInfoProps} />);
  });

  it('should render a h3', () => {
    expect(wrapper.find('h3')).toHaveLength(1);
  });

  it('should render 2 paragraphs info', () => {
    expect(wrapper.find('p [className="info"]')).toHaveLength(2);
  });
});