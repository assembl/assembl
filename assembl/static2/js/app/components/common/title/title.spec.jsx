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
  storyKindRegex: /^Title$/
});

configure({ adapter: new Adapter() });

describe('<Title /> - with shallow', () => {
  let wrapper;
  let title: TitleProps;

  beforeEach(() => {
    title = { ...defaultTitleProps };
    wrapper = shallow(<Title {...title} />);
  });

  describe('when level is set to 1 (default value)', () => {
    it('should render a h1 with an uppercased content', () => {
      expect(wrapper.find('h1').text()).toEqual('MY AWESOME TITLE');
    });
  });

  describe('when level is not set to 1', () => {
    it('should render a h2 with an uppercased content', () => {
      wrapper.setProps({ level: 2 });
      expect(wrapper.find('h2').text()).toEqual('MY AWESOME TITLE');
    });
  });
});