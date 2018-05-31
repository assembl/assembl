import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { ContentState, convertToRaw, RichUtils } from 'draft-js';

import RichTextEditor from '../../../../../js/app/components/common/richTextEditor';

describe('RichTextEditor component', () => {
  it.skip('should render a rich text editor', () => {
    const rawContentState = convertToRaw(ContentState.createFromText('foobar'));
    const updateEditorStateSpy = jest.fn(newState => newState);
    const props = {
      rawContentState: rawContentState,
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
      const rawContentState = convertToRaw(ContentState.createFromText(''));
      const rte = new RichTextEditor({ rawContentState: rawContentState });
      const actual = rte.getCharCount(rte.state.editorState);
      expect(actual).toEqual(0);
    });

    it('should return the number of characters in the editorState', () => {
      const rawContentState = convertToRaw(ContentState.createFromText('Hello world'));
      // const editorState = EditorState.createWithContent(ContentState.createFromText('Hello world'));
      const rte = new RichTextEditor({ rawContentState: rawContentState });
      const actual = rte.getCharCount(rte.state.editorState);
      expect(actual).toEqual(11);
    });
  });

  describe('shouldHidePlaceholder method', () => {
    it('should return true if the content is empty and the block type is not unstyled', () => {
      const rawContentState = convertToRaw(ContentState.createFromText(''));
      const rte = new RichTextEditor({
        rawContentState: rawContentState
      });
      const newEditorState = RichUtils.toggleBlockType(rte.state.editorState, 'unordered-list-item');
      rte.state.editorState = newEditorState;
      const actual = rte.shouldHidePlaceholder();
      expect(actual).toBeTruthy();
    });

    it('should return false if the content is not empty', () => {
      const rawContentState = convertToRaw(ContentState.createFromText('Hello world'));
      const rte = new RichTextEditor({
        rawContentState: rawContentState
      });
      const actual = rte.shouldHidePlaceholder();
      expect(actual).toBeFalsy();
    });

    it('should return false if the block type is unstyled', () => {
      const rawContentState = convertToRaw(ContentState.createFromText(''));
      const rte = new RichTextEditor({
        rawContentState: rawContentState
      });
      const actual = rte.shouldHidePlaceholder();
      expect(actual).toBeFalsy();
    });
  });
});