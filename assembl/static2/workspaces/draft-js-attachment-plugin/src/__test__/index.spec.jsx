// @flow
import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import createAttachmentPlugin from '../index';

configure({ adapter: new Adapter() });

describe('createAttachmentPlugin function', () => {
  it('should create a decorated attachment button', () => {
    const closeModalSpy = jest.fn();
    const setModalContentSpy = jest.fn();
    const plugin = createAttachmentPlugin({
      closeModal: closeModalSpy,
      setModalContent: setModalContentSpy,
      theme: {
        button: 'my-btn',
        buttonWrapper: 'my-btn-wrapper'
      }
    });
    const getEditorStateSpy = jest.fn();
    const setEditorStateSpy = jest.fn();
    plugin.initialize({
      getEditorState: getEditorStateSpy,
      setEditorState: setEditorStateSpy
    });
    const DecoratedAttachmentButton = plugin.AttachmentButton;
    const wrapper = shallow(<DecoratedAttachmentButton />);

    wrapper.props().store.getEditorState();
    expect(getEditorStateSpy.mock.calls.length).toBe(1);
    const DummyEditorState = {};
    wrapper.props().store.setEditorState(DummyEditorState);
    expect(setEditorStateSpy.mock.calls.length).toBe(1);
    expect(setEditorStateSpy.mock.calls[0][0]).toBe(DummyEditorState);

    wrapper.props().closeModal();
    expect(closeModalSpy).toHaveBeenCalled();

    wrapper.props().setModalContent('dummy content');
    expect(setModalContentSpy).toHaveBeenCalledWith('dummy content');

    expect(wrapper.props().ownTheme).toEqual({
      button: 'my-btn',
      buttonWrapper: 'my-btn-wrapper'
    });
  });
});