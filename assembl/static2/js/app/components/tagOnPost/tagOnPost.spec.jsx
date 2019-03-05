// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import TagOnPost from './tagOnPost';
import TagContainer from '../common/tagContainer/tagContainer';
import SuggestionContainer from '../common/suggestionContainer/suggestionContainer';

configure({ adapter: new Adapter() });

describe('<TagOnPost /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    const defaultProps = {
      suggestedKeywords: [],
      postId: '0',
      tagList: [{ id: '0', value: 'Habitat et SDF' }, { id: '1', value: 'Facilitation' }]
    };
    wrapper = shallow(<TagOnPost {...defaultProps} />);
  });

  it('should render a TagContainer component', () => {
    expect(wrapper.find(TagContainer)).toHaveLength(1);
  });

  it('should render a SuggestionContainer component', () => {
    expect(wrapper.find(SuggestionContainer)).toHaveLength(1);
  });
});