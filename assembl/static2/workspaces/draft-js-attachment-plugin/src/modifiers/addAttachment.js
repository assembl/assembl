// @flow
import { EditorState, AtomicBlockUtils } from 'draft-js';

type AttachmentData = {
  id: string,
  mimeType: string,
  src: string,
  title: string
};
export default (editorState: EditorState, data: AttachmentData) => {
  let entityType;
  if (data.mimeType.startsWith('image/')) {
    entityType = 'IMAGE';
  } else {
    entityType = 'DOCUMENT';
  }

  const contentState = editorState.getCurrentContent();
  // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
  const contentStateWithEntity = contentState.createEntity(entityType, 'IMMUTABLE', data);
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
  return EditorState.forceSelection(newEditorState, newEditorState.getCurrentContent().getSelectionAfter());
};