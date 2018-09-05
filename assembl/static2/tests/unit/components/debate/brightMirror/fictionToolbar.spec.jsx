// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
// import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import FictionToolbar from '../../../../../js/app/components/debate/brightMirror/fictionToobar';
import DeletePostButton from '../../../../../js/app/components/debate/common/deletePostButton';
import EditPostButton from '../../../../../js/app/components/debate/common/editPostButton';
import type { FictionToolbarProps } from '../../../../../js/app/components/debate/brightMirror/fictionToobar';

// Import existing storybook data
// import { defaultFictionHeader } from '../../../../../js/app/stories/components/debate/brightMirror/fictionHeader.stories';
const defaultFictionHeader = {
  fictionId: 'azertyuiop',
  onDeleteCallback: jest.fn(),
  originalBody: 'Vous ne voulez pas un whisky d abord?',
  title: 'Red is dead',
  onModifyCallback: jest.fn(),
  lang: 'fr'
};

// Separate the snapshots in directories next to each component
// Name should match with the story name
// initStoryshots({
//   storyKindRegex: /^FictionToolbar$/
// });

configure({ adapter: new Adapter() });

describe('<FictionToolbar /> - with shallow', () => {
  let wrapper;
  let fictionToolbar: FictionToolbarProps;

  beforeEach(() => {
    fictionToolbar = { ...defaultFictionHeader };
    wrapper = shallow(<FictionToolbar {...fictionToolbar} />);
  });

  it('should render one DeletePostButton', () => {
    expect(wrapper.find(DeletePostButton)).toHaveLength(1);
  });

  it('should render one EditPostButton', () => {
    expect(wrapper.find(EditPostButton)).toHaveLength(1);
  });
});