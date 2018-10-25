// @flow
import React from 'react';
import initStoryshots, { shallowSnapshot } from '@storybook/addon-storyshots';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { DumbSideCommentBox } from '../../../../../../js/app/components/debate/brightMirror/sideComment/sideCommentBox';
import {
  defaultSideCommentBox,
  multipleSideCommentBox,
  submittingSideCommentBox
} from '../../../../../../js/app/stories/components/debate/brightMirror/sideComment/sideCommentBox.stories';

// Separate the snapshots in directories next to each component
// Name should match with the story name
initStoryshots({
  storyKindRegex: /^SideCommentBox$/,
  test: shallowSnapshot
});

configure({ adapter: new Adapter() });

jest.mock('annotator_range');

describe('<SideCommentBox /> - default with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DumbSideCommentBox {...defaultSideCommentBox} />);
  });

  it('should render number in header', () => {
    expect(wrapper.find('div [className="extracts-nb-msg"]')).toHaveLength(1);
  });

  it('should render author name', () => {
    expect(wrapper.find('div [className="username"]')).toHaveLength(1);
  });

  it('should render creation date', () => {
    expect(wrapper.find('div [className="harvesting-date"]')).toHaveLength(1);
  });

  it('should render body', () => {
    expect(wrapper.find('div [className="body-container"]')).toHaveLength(1);
  });

  it('should not render navigation arrows', () => {
    expect(wrapper.find('div [className="assembl-icon-down-open grey"]')).toHaveLength(0);
    expect(wrapper.find('div [className="assembl-icon-down-open grey"]')).toHaveLength(0);
  });

  it('should not render richtext', () => {
    expect(wrapper.find('div [className="rich-text-editor"]')).toHaveLength(0);
  });

  it('should not render footer', () => {
    expect(wrapper.find('div [className="harvesting-box-footer"]')).toHaveLength(0);
  });
});

describe('<SideCommentBox /> - multiple with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DumbSideCommentBox {...multipleSideCommentBox} />);
  });

  it('should render number in header', () => {
    expect(wrapper.find('div [className="extracts-nb-msg"]')).toHaveLength(1);
  });

  it('should render author name', () => {
    expect(wrapper.find('div [className="username"]')).toHaveLength(1);
  });

  it('should render creation date', () => {
    expect(wrapper.find('div [className="harvesting-date"]')).toHaveLength(1);
  });

  it('should render body', () => {
    expect(wrapper.find('div [className="body-container"]')).toHaveLength(1);
  });

  it('should render navigation arrows', () => {
    expect(wrapper.find('div [className="assembl-icon-down-open grey"]')).toHaveLength(1);
  });

  it('should not render richtext', () => {
    expect(wrapper.find('div [className="rich-text-editor"]')).toHaveLength(0);
  });

  it('should not render footer', () => {
    expect(wrapper.find('div [className="harvesting-box-footer"]')).toHaveLength(0);
  });
});

describe('<SideCommentBox /> - submitting with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DumbSideCommentBox {...submittingSideCommentBox} />);
  });

  it('should not render number in header', () => {
    expect(wrapper.find('div [className="extracts-nb-msg"]')).toHaveLength(0);
  });

  it('should render author name', () => {
    expect(wrapper.find('div [className="username"]')).toHaveLength(1);
  });

  it('should render creation date', () => {
    expect(wrapper.find('div [className="harvesting-date"]')).toHaveLength(1);
  });

  it('should not render body', () => {
    expect(wrapper.find('div [className="body-container"]')).toHaveLength(0);
  });

  it('should not render navigation arrows', () => {
    expect(wrapper.find('div [className="assembl-icon-down-open grey"]')).toHaveLength(0);
  });

  it('should render richtext', () => {
    expect(wrapper.find('RichTextEditor')).toHaveLength(1);
  });

  it('should render footer', () => {
    expect(wrapper.find('div [className="harvesting-box-footer"]')).toHaveLength(1);
  });
});