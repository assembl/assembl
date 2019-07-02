// @flow
import React from 'react';
import { Link } from 'react-router';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import SharePostButton from '../../../../../js/app/components/debate/common/sharePostButton';

// Import existing storybook data
import { defaultSharePostButtonProps } from '../../../../../js/app/stories/components/debate/common/sharePostButton.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^SharePostButton$/
});

configure({ adapter: new Adapter() });

describe('<SharePostButton /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<SharePostButton {...defaultSharePostButtonProps} />);
  });

  it('should render one Link with a share icon embedded', () => {
    expect(wrapper.find(Link)).toHaveLength(1);
    expect(wrapper.find('span[className="assembl-icon-share"]')).toHaveLength(1);
  });
});