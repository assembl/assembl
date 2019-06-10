// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16.3';

import FictionHeader from '../../../../../js/app/components/debate/brightMirror/fictionHeader';
import CircleAvatar from '../../../../../js/app/components/debate/brightMirror/circleAvatar';
import type { FictionHeaderProps } from '../../../../../js/app/components/debate/brightMirror/fictionHeader';

// Import existing storybook data
import { defaultFictionHeader } from '../../../../../js/app/stories/components/debate/brightMirror/fictionHeader.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionHeader$/
});

configure({ adapter: new Adapter() });

describe('<FictionHeader /> - with shallow', () => {
  let wrapper;
  let fictionHeader: FictionHeaderProps;

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
    expect(wrapper.contains(defaultFictionHeader.authorFullname)).toBe(true);
  });

  it('should display "no author specified" when authorFullname is null', () => {
    wrapper.setProps({ authorFullname: '' });
    expect(wrapper.contains('Auteur non défini')).toBe(true);
  });

  it('should display the article published date', () => {
    expect(wrapper.find(`time[dateTime="${defaultFictionHeader.publishedDate}"]`)).toHaveLength(1);
    expect(wrapper.contains(defaultFictionHeader.displayedPublishedDate)).toBe(true);
  });
});