// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import KeywordInfo from './keywordInfo';
import { defaultKeywordInfoProps } from './keywordInfo.stories';

initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|KeywordInfo$/
});

configure({ adapter: new Adapter() });

describe('<KeywordInfo /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<KeywordInfo {...defaultKeywordInfoProps} />);
  });

  it('should render a h3', () => {
    expect(wrapper.find('h3')).toHaveLength(1);
  });

  it('should render 2 paragraphs info', () => {
    expect(wrapper.find('p[className="info"]')).toHaveLength(2);
  });
});