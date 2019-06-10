// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

// Helpers imports
import { I18n } from 'react-redux-i18n';

import TagContainer from './tagContainer';
import type { Props } from './tagContainer';
import { defaultProps } from './tagContainer.stories';

initStoryshots({
  storyKindRegex: /^Tag\s{1}On\s{1}Post\|TagContainer$/,
  test: function ({ story, context }) {
    const result = shallow(story.render(context));
    expect(result).toMatchSnapshot();
  }
});

configure({ adapter: new Adapter() });

describe('<TagOnPost /> - with shallow', () => {
  let wrapper;
  let tagContainerProps: Props;

  describe('when the user is an admin', () => {
    beforeEach(() => {
      tagContainerProps = {
        ...defaultProps,
        isAdmin: true
      };
      wrapper = shallow(<TagContainer {...tagContainerProps} />);
    });

    it('should render a title', () => {
      expect(wrapper.find('div[className="title"]')).toHaveLength(1);
      expect(wrapper.find('div[className="title"]').text()).toEqual(I18n.t('debate.tagOnPost.tagContainerAdminTitle'));
    });

    it('should render a list of tags', () => {
      expect(wrapper.find('div[className="tag-list"]')).toHaveLength(1);
    });
  });

  describe('when the user is not an admin', () => {
    beforeEach(() => {
      tagContainerProps = {
        ...defaultProps,
        isAdmin: false
      };
      wrapper = shallow(<TagContainer {...tagContainerProps} />);
    });

    it('should render a title', () => {
      expect(wrapper.find('div[className="title"]')).toHaveLength(1);
      expect(wrapper.find('div[className="title"]').text()).toEqual(I18n.t('debate.tagOnPost.tagContainerTitle'));
    });

    it('should render a list of tags', () => {
      expect(wrapper.find('div[className="tag-list"]')).toHaveLength(1);
    });
  });
});