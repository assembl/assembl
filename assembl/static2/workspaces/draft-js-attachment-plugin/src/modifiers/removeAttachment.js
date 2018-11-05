// @flow
import { EditorState } from 'draft-js';

export default function (editorState: EditorState, blockKey: string) {
  const contentState = editorState.getCurrentContent();
  let newContentState = contentState.deleteIn(['blockMap', blockKey]);

  // also remove next block if it is empty and unstyled
  const nextBlock = contentState.getBlockAfter(blockKey);
  if (nextBlock && nextBlock.getType() === 'unstyled' && !nextBlock.getLength()) {
    newContentState = newContentState.set('blockMap', newContentState.get('blockMap').delete(nextBlock.getKey()));
  }

  let newEditorState = EditorState.push(editorState, newContentState, 'remove-range');
  newEditorState = EditorState.moveSelectionToEnd(newEditorState);
  return newEditorState;
}