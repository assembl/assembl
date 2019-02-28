// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import TagContainer from './tagContainer';

initStoryshots({
  storyKindRegex: /^Tag\s{1}On\s{1}Post\|TagContainer$/
});

configure({ adapter: new Adapter() });

describe('<TagOnPost /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<TagContainer />);
  });

  it('should render a title', () => {
    expect(wrapper.find('div [className="title"]')).toHaveLength(1);
  });

  it('should render a list of tags', () => {
    expect(wrapper.find('div [className="tag-list"]')).toHaveLength(1);
  });
});