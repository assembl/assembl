import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { ContentState, EditorState, RichUtils } from 'draft-js';

import RichTextEditor from '../../../../../js/app/components/common/richTextEditor';

describe('RichTextEditor component', () => {
  it.skip('should render a rich text editor', () => {
    const editorState = EditorState.createEmpty();
    const updateEditorStateSpy = jest.fn((newState) => {
      return newState;
    });
    const props = {
      editorState: editorState,
      maxLength: 2000,
      placeholder: 'Write here',
      updateEditorState: updateEditorStateSpy
    };

    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<RichTextEditor {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });

  describe('getCharCount method', () => {
    it('should return 0 if the editorState content is empty', () => {
      const rte = new RichTextEditor();
      const actual = rte.getCharCount(EditorState.createEmpty());
      expect(actual).toEqual(0);
    });

    it('should return the number of characters in the editorState', () => {
      const editorState = EditorState.createWithContent(ContentState.createFromText('Hello world'));
      const rte = new RichTextEditor();
      const actual = rte.getCharCount(editorState);
      expect(actual).toEqual(11);
    });
  });

  describe('shouldHidePlaceholder method', () => {
    it('should return true if the editorState has no content and the block type is not unstyled', () => {
      const editorState = EditorState.createEmpty();
      const newEditorState = RichUtils.toggleBlockType(editorState, 'unordered-list-item');
      const rte = new RichTextEditor();
      rte.props = {
        editorState: newEditorState
      };
      const actual = rte.shouldHidePlaceholder();
      expect(actual).toBeTruthy();
    });

    it('should return false if the editorState has content', () => {
      const editorState = EditorState.createWithContent(ContentState.createFromText('Hello world'));
      const rte = new RichTextEditor();
      rte.props = {
        editorState: editorState
      };
      const actual = rte.shouldHidePlaceholder();
      expect(actual).toBeFalsy();
    });

    it('should return false if the block type is unstyled', () => {
      const editorState = EditorState.createEmpty();
      const rte = new RichTextEditor();
      rte.props = {
        editorState: editorState
      };
      const actual = rte.shouldHidePlaceholder();
      expect(actual).toBeFalsy();
    });
  });
});