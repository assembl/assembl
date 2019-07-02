// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import TagOnPost from './tagOnPost';
import TagContainer from '../../../components/common/tagContainer/tagContainer';
import SuggestionContainer from '../../../components/common/suggestionContainer/suggestionContainer';

configure({ adapter: new Adapter() });

describe('<TagOnPost /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<TagOnPost />);
  });

  it('should render a TagContainer component', () => {
    expect(wrapper.find(TagContainer)).toHaveLength(1);
  });

  it('should render a SuggestionContainer component', () => {
    expect(wrapper.find(SuggestionContainer)).toHaveLength(1);
  });
});