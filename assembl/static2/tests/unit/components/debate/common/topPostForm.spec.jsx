// @flow
import React from 'react';
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { DumbTopPostForm, getClassNames, submittingState } from '../../../../../js/app/components/debate/common/topPostForm';
import type { Props } from '../../../../../js/app/components/debate/common/topPostForm';
import { MESSAGE_VIEW } from '../../../../../js/app/constants';

configure({ adapter: new Adapter() });

const topPostFormProps: Props = {
  contentLocale: 'en',
  ideaId: '123456',
  messageClassifier: 'positive',
  scrollOffset: 200,
  fillBodyLabelMsgId: '654321',
  bodyPlaceholderMsgId: '678910',
  postSuccessMsgId: '019876',
  draftSuccessMsgId: '8765432',
  createPost: jest.fn(),
  refetchIdea: jest.fn(),
  uploadDocument: jest.fn(),
  onDisplayForm: jest.fn(),
  draftable: false,
  ideaOnColumn: false,
  isDebateModerated: false,
  messageViewOverride: MESSAGE_VIEW.thread
};

describe('<TopPostForm /> - with shallow', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallow(<DumbTopPostForm {...topPostFormProps} />);
  });

  it('should expand the component', () => {
    const instance = wrapper.instance();
    instance.displayForm(true);
    const isActive = wrapper.state().isActive;
    expect(isActive).toBe(true);
  });

  it('should collapse the component', () => {
    wrapper.setState({ isActive: true });
    const instance = wrapper.instance();
    instance.resetForm(false);
    const isActive = wrapper.state().isActive;
    expect(isActive).toBe(false);
  });

  it('should not render buttons when the component is collapsed', () => {
    wrapper.setState({ isActive: false });
    expect(wrapper.find('Button')).toHaveLength(0);
  });

  it('should render 2 buttons when the component is expanded but not draftable', () => {
    wrapper.setState({ isActive: true });
    expect(wrapper.find('Button')).toHaveLength(2);
  });

  it('should render 3 buttons when the component is expanded and draftable', () => {
    wrapper.setState({ isActive: true });
    wrapper.setProps({ draftable: true });
    expect(wrapper.find('Button')).toHaveLength(3);
  });

  it('should not render the rich text editor when the component is collapse', () => {
    wrapper.setState({ isActive: false });
    expect(wrapper.find('.rich-text-editor')).toHaveLength(0);
  });

  it('should update the body with the new value', () => {
    const instance = wrapper.instance();
    instance.updateBody({ foo: 'bar' });
    const body = wrapper.state().body;
    expect(body).toEqual({ foo: 'bar' });
  });

  it('should update the subject with the new value', () => {
    const instance = wrapper.instance();
    instance.handleSubjectChange({ target: { value: 'Hello' } });
    const subject = wrapper.state().subject;
    expect(subject).toEqual('Hello');
  });

  it('should return a key to display a message in the alert when the subject is not filled', () => {
    const instance = wrapper.instance();
    const result = instance.getWarningMessageToDisplay('PUBLISHED', '', false, false);
    const expectedResult = 'debate.thread.fillSubject';
    expect(result).toEqual(expectedResult);
  });

  it('should return a key to display a message in the alert when the body is not filled', () => {
    const instance = wrapper.instance();
    const result = instance.getWarningMessageToDisplay('PUBLISHED', 'Here the subject', true, false);
    expect(result).toEqual('654321');
  });

  it('should return a key to display a message in the alert when the body and the subject are not filled in a draft', () => {
    const instance = wrapper.instance();
    const result = instance.getWarningMessageToDisplay('DRAFT', '', true, false);
    expect(result).toEqual('debate.brightMirror.fillEitherTitleContent');
  });

  it('should return null when the form is fully completed', () => {
    const instance = wrapper.instance();
    const result = instance.getWarningMessageToDisplay('PUBLISHED', 'Here the subject', false, false);
    expect(result).toEqual(null);
  });
});

describe('<TopPostForm /> - with mount', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<DumbTopPostForm {...topPostFormProps} />);
  });

  it('should render the title input when the component is not on multi column view', () => {
    expect(wrapper.find('input[name="top-post-title"]')).toHaveLength(1);
  });

  it('should not render the title input when the component is on multi column view', () => {
    wrapper.setProps({ ideaOnColumn: true });
    expect(wrapper.find('input[name="top-post-title"]')).toHaveLength(0);
  });
});

describe('getClassNames function', () => {
  it('should return the button class names when the multi-column view is active', () => {
    const buttonClasses = getClassNames(true, false);
    const expectedResult = 'button-submit button-dark btn btn-default right margin-m';
    expect(buttonClasses).toBe(expectedResult);
  });

  it('should return the button class names when the submitting mode is active', () => {
    const result = getClassNames(false, true);
    const expectedResult = 'button-submit button-dark btn btn-default right margin-l cursor-wait';
    expect(result).toBe(expectedResult);
  });
});

describe('submittingState function', () => {
  it('should return a submitting state', () => {
    const result = submittingState(true);
    expect(result).toEqual({ submitting: true });
  });
});