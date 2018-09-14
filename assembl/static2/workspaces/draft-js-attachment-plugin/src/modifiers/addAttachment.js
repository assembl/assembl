// @flow
import { EditorState, AtomicBlockUtils } from 'draft-js';

type AttachmentData = {
  externalUrl: string
};
export default (editorState: EditorState, data: AttachmentData) => {
  const entityType = 'IMAGE';
  const contentState = editorState.getCurrentContent();
  const contentStateWithEntity = contentState.createEntity(entityType, 'IMMUTABLE', data);
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
  return EditorState.forceSelection(newEditorState, newEditorState.getCurrentContent().getSelectionAfter());
};