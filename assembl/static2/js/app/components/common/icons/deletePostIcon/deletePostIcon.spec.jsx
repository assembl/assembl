// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import DeletePostIcon from '../deletePostIcon/deletePostIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^DeletePostIcon$/
});

configure({ adapter: new Adapter() });

describe('<DeletePostIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DeletePostIcon />);
  });

  it('should render a svg with deletePostIcon class', () => {
    expect(wrapper.find('svg[className="deletePostIcon"]')).toHaveLength(1);
    expect(wrapper.find('path')).toHaveLength(2);
  });
});