// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import FictionBody from '../../../../../js/app/components/debate/brightMirror/fictionBody';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionBody$/
});

configure({ adapter: new Adapter() });

describe('<FictionBody /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<FictionBody />);
  });

  it('should render one h1 title and one p content', () => {
    expect(wrapper.find('h1 [className="fiction-title"]')).toHaveLength(1);
    expect(wrapper.find('div [className="fiction-content"]')).toHaveLength(1);
  });

  it('should display "no title specified" as a default title value', () => {
    expect(wrapper.contains('no title specified')).toBe(true);
  });

  it('should display the fiction title', () => {
    const customTitle = 'sed sit repellat';
    wrapper.setProps({ title: customTitle });
    expect(wrapper.contains(customTitle)).toBe(true);
  });

  it('should display "no content specified" as a default content value', () => {
    expect(wrapper.contains('no content specified')).toBe(true);
  });

  it('should display the fiction content', () => {
    const customContent = `
      Dicta sit ipsam modi aut et. Quae et repellat qui illo velit. Quibusdam accusantium minima.
      Molestiae consequatur rerum sit ipsa.
    `;
    wrapper.setProps({ content: customContent });
    expect(wrapper.contains(customContent)).toBe(true);
  });
});