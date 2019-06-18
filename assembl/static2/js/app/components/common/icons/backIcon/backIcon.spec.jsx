// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import BackIcon from './backIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^BackIcon$/
});

configure({ adapter: new Adapter() });

describe('<BackIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<BackIcon />);
  });

  it('should render a svg composed by 2 path and a circle', () => {
    expect(wrapper.find('svg')).toHaveLength(1);
    expect(wrapper.find('path')).toHaveLength(2);
    expect(wrapper.find('circle')).toHaveLength(1);
  });
});