// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import AddkeywordIcon from './addkeywordIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^AddkeywordIcon$/
});

configure({ adapter: new Adapter() });

describe('<AddkeywordIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<AddkeywordIcon />);
  });

  it('should render a svg with addkeyword-icon class', () => {
    expect(wrapper.find('svg[className="addkeyword-icon"]')).toHaveLength(1);
  });
});