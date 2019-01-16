// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import ToolbarSlider from './toolbarSlider';

initStoryshots({
  storyKindRegex: /^ToolbarSlider$/
});

configure({ adapter: new Adapter() });

describe('<ToolbarSlider /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<ToolbarSlider defaultValue={0} onSliderChange={() => {}} />);
  });

  it('should render a <Slider /> with a cursor', () => {
    expect(wrapper.find('WithStyles(Slider) [thumb]')).toHaveLength(1);
  });
});