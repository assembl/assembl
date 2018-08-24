// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import FictionHeader from '../../../../../js/app/components/debate/brightMirror/fictionHeader';
import CircleAvatar from '../../../../../js/app/components/debate/brightMirror/circleAvatar';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionHeader$/
});

configure({ adapter: new Adapter() });

describe('<FictionHeader /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<FictionHeader />);
  });

  it('should render one header tag', () => {
    expect(wrapper.find('header')).toHaveLength(1);
  });

  it('should render one CircleAvatar with default value', () => {
    expect(wrapper.find(CircleAvatar)).toHaveLength(1);
  });

  it('should render one CircleAvatar with custom value', () => {
    const circleAvatarProps = { src: 'https://loremflickr.com/300/300' };
    wrapper.setProps({ circleAvatar: { ...circleAvatarProps } });
    expect(wrapper.find('CircleAvatar [src="https://loremflickr.com/300/300"]')).toHaveLength(1);
  });

  it('should display "no author specified" as a default author value', () => {
    expect(wrapper.contains('no author specified')).toBe(true);
  });

  it('should display the article author fullname', () => {
    wrapper.setProps({ authorFullname: 'Taryn Treutel' });
    expect(wrapper.contains('Taryn Treutel')).toBe(true);
  });

  it('should display "no published date specified" as a default publishedDate value', () => {
    expect(wrapper.contains('no published date specified')).toBe(true);
  });

  it('should display the article published date', () => {
    wrapper.setProps({ publishedDate: new Date('2018-08-08').toISOString().slice(0, 10) }); // e.g. 2018-08-28
    expect(wrapper.find('time [dateTime="2018-08-08"]')).toHaveLength(1);
    expect(wrapper.contains('08/08/2018')).toBe(true);
  });
});