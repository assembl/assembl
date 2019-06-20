// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import LinkIcon from './linkIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^LinkIcon$/
});

configure({ adapter: new Adapter() });

describe('<LinkIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<LinkIcon />);
  });

  it('should render a svg composed by 2 path', () => {
    expect(wrapper.find('svg[className="linkIcon"]')).toHaveLength(1);
    expect(wrapper.find('path')).toHaveLength(2);
  });
});