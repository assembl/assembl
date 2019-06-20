// @flow
import React from 'react';

import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import initStoryshots from '@storybook/addon-storyshots';

import { DumbSideCommentBox } from '../../../../../../js/app/components/debate/brightMirror/sideComment/sideCommentBox';
import {
  defaultSideCommentBoxProps,
  multipleSideCommentBoxProps,
  submittingSideCommentBoxProps,
  canReplySideCommentBoxProps,
  withReplySideCommentBoxProps
} from '../../../../../../js/app/stories/components/debate/brightMirror/sideComment/sideCommentBox.stories';
import { displayModal } from '../../../../../../js/app/utils/utilityManager';

initStoryshots({
  storyKindRegex: /^DumbSideCommentBox$/
});

configure({ adapter: new Adapter() });

jest.mock('annotator_range');
jest.mock('../../../../../../js/app/utils/utilityManager');

describe('<SideCommentBox /> - default with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DumbSideCommentBox {...defaultSideCommentBoxProps} />);
  });

  it('should render number in header', () => {
    expect(wrapper.find('div[className="extracts-nb-msg"]')).toHaveLength(1);
  });

  it('should render InnerBoxView', () => {
    expect(wrapper.find('InnerBoxView')).toHaveLength(1);
  });

  it('should not render InnerBoxSubmit', () => {
    expect(wrapper.find('InnerBoxSubmit')).toHaveLength(0);
  });

  it('should not render extract numbering', () => {
    expect(wrapper.find('div[className="extracts-numbering"]')).toHaveLength(0);
  });

  it('should display edit form', () => {
    wrapper.setState({ editComment: true });
    expect(wrapper.find('InnerBoxSubmit')).toHaveLength(1);
  });

  it('should render a modal when function deletePost is called', () => {
    wrapper.instance().deletePost();
    expect(displayModal).toHaveBeenCalledTimes(1);
  });
});

describe('<SideCommentBox /> - multiple with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DumbSideCommentBox {...multipleSideCommentBoxProps} />);
  });

  it('should render number in header', () => {
    expect(wrapper.find('div[className="extracts-nb-msg"]')).toHaveLength(1);
  });

  it('should render InnerBoxView', () => {
    expect(wrapper.find('InnerBoxView')).toHaveLength(1);
  });

  it('should not render InnerBoxSubmit', () => {
    expect(wrapper.find('InnerBoxSubmit')).toHaveLength(0);
  });

  it('should render extract numbering', () => {
    expect(wrapper.find('div[className="extracts-numbering"]')).toHaveLength(1);
  });
});

describe('<SideCommentBox /> - submitting with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DumbSideCommentBox {...submittingSideCommentBoxProps} />);
  });

  it('should not render number in header', () => {
    expect(wrapper.find('div[className="extracts-nb-msg"]')).toHaveLength(0);
  });

  it('should not render InnerBoxView', () => {
    expect(wrapper.find('InnerBoxView')).toHaveLength(0);
  });

  it('should render InnerBoxSubmit', () => {
    expect(wrapper.find('InnerBoxSubmit')).toHaveLength(1);
  });

  it('should render extract numbering', () => {
    expect(wrapper.find('div[className="extracts-numbering"]')).toHaveLength(0);
  });
});

describe('<SideCommentBox /> - can reply with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DumbSideCommentBox {...canReplySideCommentBoxProps} />);
  });

  it('should render number in header', () => {
    expect(wrapper.find('div[className="extracts-nb-msg"]')).toHaveLength(1);
  });

  it('should render InnerBoxView', () => {
    expect(wrapper.find('InnerBoxView')).toHaveLength(1);
  });

  it('should render reply button', () => {
    expect(wrapper.find('ReplyToCommentButton')).toHaveLength(1);
  });

  it('should render InnerBoxSubmit when replying', () => {
    wrapper.setState({ replying: true });
    expect(wrapper.find('InnerBoxSubmit')).toHaveLength(1);
  });
});

describe('<SideCommentBox /> - with reply with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DumbSideCommentBox {...withReplySideCommentBoxProps} />);
  });

  it('should render number in header', () => {
    expect(wrapper.find('div[className="extracts-nb-msg"]')).toHaveLength(1);
  });

  it('should render InnerBoxView', () => {
    expect(wrapper.find('InnerBoxView')).toHaveLength(2);
  });

  it('should render reply button', () => {
    expect(wrapper.find('ReplyToCommentButton')).toHaveLength(0);
  });

  it('should not render InnerBoxSubmit', () => {
    expect(wrapper.find('InnerBoxSubmit')).toHaveLength(0);
  });

  it('should not render reply button', () => {
    expect(wrapper.find('ReplyToCommentButton')).toHaveLength(0);
  });

  it('should render disabled reply button if user can reply', () => {
    wrapper.setProps({ userCanReply: true });
    expect(wrapper.find('ReplyToCommentButton').props().disabled).toBe(true);
  });
});