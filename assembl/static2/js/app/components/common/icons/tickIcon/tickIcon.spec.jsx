// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';
/* eslint-enable */

import TickIcon from './tickIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^TickIcon$/
});

configure({ adapter: new Adapter() });

describe('<TickIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<TickIcon />);
  });

  it('should render a svg composed by 2 path', () => {
    expect(wrapper.find('svg[className="tickIcon"]')).toHaveLength(1);
  });
});