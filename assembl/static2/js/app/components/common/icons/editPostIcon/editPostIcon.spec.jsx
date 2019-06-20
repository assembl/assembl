// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { configure, shallow } from 'enzyme';
import initStoryshots from '@storybook/addon-storyshots';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import EditPostIcon from './editPostIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^EditPostIcon$/
});

configure({ adapter: new Adapter() });

describe('<EditPostIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<EditPostIcon />);
  });

  it('should render a svg with editPostIcon class', () => {
    expect(wrapper.find('svg[className="editPostIcon"]')).toHaveLength(1);
    expect(wrapper.find('path')).toHaveLength(1);
  });
});