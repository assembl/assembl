// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import CrossIcon from './crossIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^CrossIcon$/
});

configure({ adapter: new Adapter() });

describe('<CrossIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<CrossIcon />);
  });

  it('should render a svg with cross-icon class', () => {
    expect(wrapper.find('svg[className="cross-icon"]')).toHaveLength(1);
  });
});