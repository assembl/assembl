// @flow
import { type ContentBlock, type EditorState } from 'draft-js';

export function getSelectedBlockKey(editorState: EditorState): string {
  const selection = editorState.getSelection();
  return selection.getStartKey();
}

export function getSelectedBlock(editorState: EditorState): ContentBlock {
  const contentState = editorState.getCurrentContent();
  const blockKey = getSelectedBlockKey(editorState);
  return contentState.getBlockForKey(blockKey);
}