// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import SuggestionContainer from './suggestionContainer';
import type { Props } from './suggestionContainer';
import { defaultProps } from './suggestionContainer.stories';

initStoryshots({
  storyKindRegex: /^Tag\s{1}On\s{1}Post\|SuggestionContainer$/
});

configure({ adapter: new Adapter() });

describe('<SuggestionContainer /> - with shallow', () => {
  let wrapper;
  let suggestionList: Props;

  beforeEach(() => {
    suggestionList = { ...defaultProps };
    wrapper = shallow(<SuggestionContainer {...suggestionList} />);
  });

  it('should render a title', () => {
    expect(wrapper.find('div [className="title"]')).toHaveLength(1);
  });

  it('should render a list of 5 suggestions', () => {
    expect(wrapper.find('div [className="suggestion-list"]')).toHaveLength(1);
    expect(wrapper.find('span')).toHaveLength(5);
  });
});