// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import CircleAvatar from '../../../../js/app/components/common/circleAvatar';
import { getIconPath } from '../../../../js/app/utils/globalFunctions';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^CircleAvatar$/
});

configure({ adapter: new Adapter() });

const avatarIcon = getIconPath('avatar.png');

describe('<CircleAvatar /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<CircleAvatar />);
  });

  it('should render one image tag', () => {
    expect(wrapper.find('img[className="circle-avatar"]')).toHaveLength(1);
  });

  it('should render one image with a default size of 34px', () => {
    expect(wrapper.find('img[width="34"][height="34"]')).toHaveLength(1);
  });

  it('should render one image with a custom size', () => {
    wrapper.setProps({ size: '50' });
    expect(wrapper.find('img[width="50"][height="50"]')).toHaveLength(1);
  });

  it('should render one image with a default alt tag set to no-username-avatar', () => {
    expect(wrapper.find('img[alt="no-username-avatar"]')).toHaveLength(1);
  });

  it('should render one image with a custom alt tag', () => {
    wrapper.setProps({ username: 'bright-mirror-author' });
    expect(wrapper.find('img[alt="bright-mirror-author-avatar"]')).toHaveLength(1);
  });

  it(`should render one image with a default image set to ${avatarIcon}`, () => {
    expect(wrapper.find(`img[src="${avatarIcon}"]`)).toHaveLength(1);
  });

  it('should render one image with a custom image', () => {
    wrapper.setProps({ src: 'https://loremflickr.com/300/300' });
    expect(wrapper.find('img[src="https://loremflickr.com/300/300"]')).toHaveLength(1);
  });
});