// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import TagOnPost from './tagOnPost';
import TagContainer from '../common/tagContainer/tagContainer';
import SuggestionContainer from '../common/suggestionContainer/suggestionContainer';

configure({ adapter: new Adapter() });

const defaultProps = {
  isAdmin: true,
  postId: '0',
  suggestedTagList: ['Complete account of the system', 'Great pleasure', 'Actual teachings of the great explorer of the truth'],
  tagList: [{ id: '0', text: 'Habitat et SDF' }, { id: '1', text: 'Facilitation' }]
};

describe('<TagOnPost /> - with shallow', () => {
  let wrapper;

  describe('when is admin', () => {
    beforeEach(() => {
      const props = {
        ...defaultProps
      };
      wrapper = shallow(<TagOnPost {...props} />);
    });

    it('should render a TagContainer component', () => {
      expect(wrapper.find(TagContainer)).toHaveLength(1);
    });

    it('should render a SuggestionContainer component', () => {
      expect(wrapper.find(SuggestionContainer)).toHaveLength(1);
    });

    describe('when tagList is empty', () => {
      it('should still render a TagContainer component ', () => {
        wrapper.setProps({ tagList: [] });
        expect(wrapper.find(TagContainer)).toHaveLength(1);
      });
    });

    describe('when suggestedTagList is empty', () => {
      it('should not render a SuggestionContainer component ', () => {
        wrapper.setProps({ suggestedTagList: [] });
        expect(wrapper.find(SuggestionContainer)).toHaveLength(0);
      });
    });

    describe('when tagList includes one suggested tag from suggestedTagList with one tag', () => {
      it('should not render a SuggestionContainer component ', () => {
        wrapper.setProps({
          suggestedTagList: ['Habitat et SDF']
        });
        expect(wrapper.find(SuggestionContainer)).toHaveLength(0);
      });
    });

    describe('when tagList includes one suggested tag from suggestedTagList with mutliples tags', () => {
      it('should render a SuggestionContainer component ', () => {
        wrapper.setProps({
          suggestedTagList: [
            'Habitat et SDF',
            'Complete account of the system',
            'Great pleasure',
            'Actual teachings of the great explorer of the truth'
          ]
        });
        expect(wrapper.find(SuggestionContainer)).toHaveLength(1);
      });
    });
  });

  describe('when is not admin', () => {
    beforeEach(() => {
      const props = {
        ...defaultProps,
        isAdmin: false
      };
      wrapper = shallow(<TagOnPost {...props} />);
    });

    it('should render a TagContainer component', () => {
      expect(wrapper.find(TagContainer)).toHaveLength(1);
    });

    it('should not render a SuggestionContainer component', () => {
      expect(wrapper.find(SuggestionContainer)).toHaveLength(0);
    });
  });
});