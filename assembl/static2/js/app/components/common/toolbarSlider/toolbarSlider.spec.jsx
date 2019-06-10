// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import ToolbarSlider from './toolbarSlider';
import { defaultToolbarSliderProps } from './toolbarSlider.stories';

initStoryshots({
  storyKindRegex: /^Semantic\s{1}Analysis\|ToolbarSlider$/
});

configure({ adapter: new Adapter() });

describe('<ToolbarSlider /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ToolbarSlider {...defaultToolbarSliderProps} />);
  });

  it('should render a <Slider /> with a cursor', () => {
    /** expect WithStyles(Slider) and not just Slider because of its parent MuiThemeProvider component */
    expect(wrapper.find('WithStyles(Slider)[thumb]')).toHaveLength(1);
  });
});