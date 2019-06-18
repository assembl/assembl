// @flow
import React from 'react';
import { Image } from 'react-bootstrap';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import FictionCommentHeader from '../../../../../js/app/components/debate/brightMirror/fictionCommentHeader';
import type { FictionCommentHeaderProps } from '../../../../../js/app/components/debate/brightMirror/fictionCommentHeader';

// Import existing storybook data
import { defaultFictionCommentHeader } from '../../../../../js/app/stories/components/debate/brightMirror/fictionCommentHeader.stories'; // eslint-disable-line max-len

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionCommentHeader$/
});

configure({ adapter: new Adapter() });

describe('<FictionCommentHeader /> - with shallow', () => {
  let wrapper;
  let fictionCommentHeader: FictionCommentHeaderProps;

  beforeEach(() => {
    fictionCommentHeader = { ...defaultFictionCommentHeader };
    wrapper = shallow(<FictionCommentHeader {...fictionCommentHeader} />);
  });

  it('should render a title', () => {
    expect(wrapper.find('h1[className="title"]')).toHaveLength(1);
    expect(wrapper.contains(fictionCommentHeader.strongTitle)).toBe(true);
    expect(wrapper.contains(fictionCommentHeader.title)).toBe(true);
  });

  it('should display an image', () => {
    expect(wrapper.find(Image)).toHaveLength(1);
    expect(wrapper.find(`Image[src="${fictionCommentHeader.imgSrc}"]`)).toHaveLength(1);
    expect(wrapper.find(`Image[alt="${fictionCommentHeader.imgAlt}"]`)).toHaveLength(1);
  });

  it('should display a subtitle', () => {
    expect(wrapper.find('p[className="subtitle center"]')).toHaveLength(1);
    expect(wrapper.find(`Translate[count=${fictionCommentHeader.commentsCount}]`)).toHaveLength(1);
  });
});