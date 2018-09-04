// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
/* eslint-enable */

import FictionToolbar from '../../../../../js/app/components/debate/brightMirror/fictionToolbar';
import DeletePostButton from '../../../../../js/app/components/debate/common/deletePostButton';
import EditPostButton from '../../../../../js/app/components/debate/common/editPostButton';
import type { FictionToolbarProps } from '../../../../../js/app/components/debate/brightMirror/fictionToolbar';

// Import existing storybook data
import { defaultFictionToolbar } from '../../../../../js/app/stories/components/debate/brightMirror/fictionToolbar.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionToolbar$/
});

configure({ adapter: new Adapter() });

describe('<FictionToolbar /> - with shallow', () => {
  let wrapper;
  let fictionToolbar: FictionToolbarProps;

  beforeEach(() => {
    fictionToolbar = { ...defaultFictionToolbar };
    wrapper = shallow(<FictionToolbar {...fictionToolbar} />);
  });

  it('should render one DeletePostButton when userCanDelete is true', () => {
    wrapper.setProps({ userCanDelete: true });
    expect(wrapper.find(DeletePostButton)).toHaveLength(1);
  });

  it('should render one EditPostButton', () => {
    expect(wrapper.find(EditPostButton)).toHaveLength(1);
  });

  it('should not render EditPostButton if cannot edit', () => {
    expect(wrapper.find(EditPostButton)).toHaveLength(0);
  });

  it('should not render DeletePostButton when userCanDelete is false', () => {
    wrapper.setProps({ userCanDelete: false });
    expect(wrapper.find(DeletePostButton)).toHaveLength(0);
  });
});