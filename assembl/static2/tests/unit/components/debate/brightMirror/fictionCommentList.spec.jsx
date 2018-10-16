// @flow
import React from 'react';
import initStoryshots from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import FictionCommentList from '../../../../../js/app/components/debate/brightMirror/fictionCommentList';
import { Tree } from '../../../../../js/app/components/common/tree';
import type { FictionCommentListProps } from '../../../../../js/app/components/debate/brightMirror/fictionCommentList';

// Import existing storybook data
import { defaultFictionCommentList } from '../../../../../js/app/stories/components/debate/brightMirror/fictionCommentList.stories'; // eslint-disable-line max-len

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^FictionCommentList$/
});

configure({ adapter: new Adapter() });

describe('<FictionCommentList /> - with shallow', () => {
  let wrapper;
  let fictionCommentList: FictionCommentListProps;

  beforeEach(() => {
    fictionCommentList = { ...defaultFictionCommentList };
    wrapper = shallow(<FictionCommentList {...fictionCommentList} />);
  });

  it('should render one Tree component', () => {
    expect(wrapper.find(Tree)).toHaveLength(1);
  });
});