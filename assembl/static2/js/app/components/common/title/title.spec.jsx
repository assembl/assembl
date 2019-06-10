// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */
import Title from './title';
import type { Props as TitleProps } from './title';
import { defaultTitleProps } from './title.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|Title$/
});

configure({ adapter: new Adapter() });

describe('<Title /> - with shallow', () => {
  let wrapper;
  let title: TitleProps;

  beforeEach(() => {
    title = { ...defaultTitleProps };
    wrapper = shallow(<Title {...title} />);
  });

  describe('when level is set to 1 (default value) with grey-title1 class', () => {
    it('should render a h1', () => {
      expect(wrapper.find('h1[className="grey-title1"]').text()).toEqual('My awesome title');
    });
  });

  describe('when level is not set to 1', () => {
    it('should render a h2 with grey-title2 class', () => {
      wrapper.setProps({ level: 2 });
      expect(wrapper.find('h2[className="grey-title2"]').text()).toEqual('My awesome title');
    });
  });
});