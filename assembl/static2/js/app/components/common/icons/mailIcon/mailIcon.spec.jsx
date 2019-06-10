// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import MailIcon from './mailIcon';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^MailIcon$/
});

configure({ adapter: new Adapter() });

describe('<MailIcon /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<MailIcon />);
  });

  it('should render a svg composed by 2 path', () => {
    expect(wrapper.find('svg[className="mailIcon"]')).toHaveLength(1);
  });
});