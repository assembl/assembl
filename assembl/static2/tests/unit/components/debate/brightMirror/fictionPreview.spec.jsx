// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import FictionPreview from '../../../../../js/app/components/debate/brightMirror/fictionPreview';
import { customFictionPreview } from '../../../../../js/app/stories/components/debate/brightMirror/fictionPreview.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionPreview$/
});

configure({ adapter: new Adapter() });

describe('<FictionPreview /> - with shallow', () => {
  let wrapper;
  let fictionPreview;

  beforeEach(() => {
    fictionPreview = { ...customFictionPreview };
    wrapper = shallow(<FictionPreview {...fictionPreview} />);
  });

  it('should render title', () => {
    expect(wrapper.find('h3 [className="light-title-3 center"]')).toHaveLength(1);
  });

  it('should render author name', () => {
    expect(wrapper.find('span [className="author"]')).toHaveLength(1);
  });

  it('should render creation date', () => {
    expect(wrapper.find('span [className="published-date"]')).toHaveLength(1);
  });
});