// @flow
import { AtomicBlockUtils, ContentState, EditorState } from 'draft-js';
import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16'; // eslint-disable-line

import { constants } from 'assembl-editor-utils';

import createAttachmentPlugin from '../index';
import removeAttachment from '../modifiers/removeAttachment';

configure({ adapter: new Adapter() });

jest.mock('../components/DocumentIcon', () => 'DummyDocumentIcon');
jest.mock('../components/Image', () => 'DummyImage');
jest.mock('../modifiers/removeAttachment');

const { ENTITY_MUTABILITY, ENTITY_TYPES } = constants;

describe('createAttachmentPlugin function', () => {
  it('should provides a decorated attachment button', () => {
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

  it('should provides a decorated Attachments component', () => {
    const plugin = createAttachmentPlugin({
      closeModal: jest.fn(),
      setModalContent: jest.fn(),
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
    const DecoratedAttachments = plugin.Attachments;
    const wrapper = shallow(<DecoratedAttachments />);
    wrapper.props().store.getEditorState();
    expect(getEditorStateSpy).toHaveBeenCalled();
    wrapper.props().removeAttachment({ blockKey: 'block', entityKey: '0' });
    expect(removeAttachment).toHaveBeenCalledWith({ blockKey: 'block', entityKey: '0' });
  });

  describe('blockRendererFn function', () => {
    let plugin;

    beforeEach(() => {
      const closeModalSpy = jest.fn();
      const setModalContentSpy = jest.fn();
      plugin = createAttachmentPlugin({
        closeModal: closeModalSpy,
        setModalContent: setModalContentSpy
      });
    });

    it('should return null for non atomic blocks', () => {
      const contentState = ContentState.createFromText('foo');
      const editorState = EditorState.createWithContent(contentState);
      const args = {
        getEditorState: () => editorState,
        setEditorState: jest.fn()
      };
      const block = contentState.getFirstBlock();
      const output = plugin.blockRendererFn(block, args);
      expect(output).toBeNull();
    });

    it('should render an atomic block with an image', () => {
      let contentState = ContentState.createFromText('');
      contentState = contentState.createEntity(ENTITY_TYPES.image, ENTITY_MUTABILITY.immutable, { src: 'my-img.png' });
      const entityKey = contentState.getLastCreatedEntityKey();
      let editorState = EditorState.createWithContent(contentState);
      editorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
      contentState = editorState.getCurrentContent();
      const blocks = contentState.getBlocksAsArray();
      const atomicBlock = blocks[1];

      const args = {
        getEditorState: () => editorState,
        setEditorState: jest.fn()
      };
      const output = plugin.blockRendererFn(atomicBlock, args);
      expect(output).not.toBeNull();
      if (output) {
        expect(output.editable).toBeFalsy();
        expect(output.component).toEqual('DummyImage');
      }
    });

    it('should render an atomic block with a document', () => {
      let contentState = ContentState.createFromText('');
      // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
      contentState = contentState.createEntity(ENTITY_TYPES.document, ENTITY_MUTABILITY.immutable, { src: 'my-img.png' });
      const entityKey = contentState.getLastCreatedEntityKey();
      let editorState = EditorState.createWithContent(contentState);
      editorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
      contentState = editorState.getCurrentContent();
      const blocks = contentState.getBlocksAsArray();
      const atomicBlock = blocks[1];

      const args = {
        getEditorState: () => editorState,
        setEditorState: jest.fn()
      };
      const output = plugin.blockRendererFn(atomicBlock, args);
      expect(output).not.toBeNull();
      if (output) {
        expect(output.editable).toBeFalsy();
        expect(output.component).toEqual('DummyDocumentIcon');
      }
    });
  });
});