// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import FictionHeader from '../../../../../js/app/components/debate/brightMirror/fictionHeader';
import CircleAvatar from '../../../../../js/app/components/debate/brightMirror/circleAvatar';
import type { FictionHeaderType } from '../../../../../js/app/components/debate/brightMirror/fictionHeader';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionHeader$/
});

configure({ adapter: new Adapter() });

const defaultFictionHeader: FictionHeaderType = {
  authorFullname: 'Taryn Treutel',
  publishedDate: new Date('2018-08-08'),
  circleAvatar: {
    username: 'taryn-treutel',
    src: 'https://loremflickr.com/300/300'
  }
};

describe('<FictionHeader /> - with shallow', () => {
  let wrapper;
  let fictionHeader;

  beforeEach(() => {
    fictionHeader = { ...defaultFictionHeader };
    wrapper = shallow(<FictionHeader {...fictionHeader} />);
  });

  it('should render one header tag', () => {
    expect(wrapper.find('header')).toHaveLength(1);
  });

  it('should render one CircleAvatar with default value', () => {
    expect(wrapper.find(CircleAvatar)).toHaveLength(1);
  });

  it('should display the article author fullname', () => {
    expect(wrapper.contains('Taryn Treutel')).toBe(true);
  });

  it('should display "no author specified" when authorFullname is null', () => {
    wrapper.setProps({ authorFullname: '' });
    expect(wrapper.contains('no author specified')).toBe(true);
  });

  it('should display the article published date', () => {
    expect(wrapper.find('time [dateTime="2018-08-08"]')).toHaveLength(1);
    expect(wrapper.contains('08/08/2018')).toBe(true);
  });
});