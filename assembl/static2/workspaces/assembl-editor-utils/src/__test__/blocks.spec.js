// @flow
import { ContentState, EditorState } from 'draft-js';

import { getSelectedBlockKey, getSelectedBlock } from '../blocks';

describe('getSelectedBlockKey function', () => {
  it('should get selected block key', () => {
    const contentState = ContentState.createFromText('we need to connect the bluetooth SSL capacitor!');
    const block = contentState.getFirstBlock();
    const blockKey = block.getKey();
    const editorState = EditorState.createWithContent(contentState);
    expect(getSelectedBlockKey(editorState)).toEqual(blockKey);
  });
});

describe('getSelectedBlock function', () => {
  it('should get selected block', () => {
    const contentState = ContentState.createFromText('we need to connect the bluetooth SSL capacitor!');
    const block = contentState.getFirstBlock();
    const editorState = EditorState.createWithContent(contentState);
    expect(getSelectedBlock(editorState)).toEqual(block);
  });
});