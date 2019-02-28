// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import SuggestionContainer from './suggestionContainer';

configure({ adapter: new Adapter() });

describe('<SuggestionContainer /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SuggestionContainer />);
  });

  it('should render a title', () => {
    expect(wrapper.find('div [className="title"]')).toHaveLength(1);
  });

  it('should render a list of suggestion', () => {
    expect(wrapper.find('div [className="suggestion-list"]')).toHaveLength(1);
  });
});