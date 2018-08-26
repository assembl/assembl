// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import FictionBody from '../../../../../js/app/components/debate/brightMirror/fictionBody';
import type { FictionBodyType } from '../../../../../js/app/components/debate/brightMirror/fictionBody';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionBody$/
});

configure({ adapter: new Adapter() });

const defaultTitle: string = 'Fugit veritatis nemo';
const defaultContent: string = 'Vero et ut et quia quo. Molestiae ut cupiditate odio numquam veniam esse cumque modi.';

const defaultFictionBody: FictionBodyType = {
  title: defaultTitle,
  content: defaultContent
};

describe('<FictionBody /> - with shallow', () => {
  let wrapper;
  let fictionBody: FictionBodyType;

  beforeEach(() => {
    fictionBody = { ...defaultFictionBody };
    wrapper = shallow(<FictionBody {...fictionBody} />);
  });

  it('should render one h1 title and one p content', () => {
    expect(wrapper.find('h1 [className="fiction-title"]')).toHaveLength(1);
    expect(wrapper.find('div [className="fiction-content"]')).toHaveLength(1);
  });

  it('should display the fiction title', () => {
    expect(wrapper.contains(defaultTitle)).toBe(true);
  });

  it('should display the fiction content', () => {
    expect(wrapper.contains(defaultContent)).toBe(true);
  });

  it('should display "no title specified" as a default title value', () => {
    wrapper.setProps({ title: '' });
    expect(wrapper.contains('no title specified')).toBe(true);
  });

  it('should display "no content specified" as a default content value', () => {
    wrapper.setProps({ content: '' });
    expect(wrapper.contains('no content specified')).toBe(true);
  });
});