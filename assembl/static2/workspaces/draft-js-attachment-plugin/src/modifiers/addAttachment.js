// @flow
import { EditorState, AtomicBlockUtils } from 'draft-js';
import { constants } from 'assembl-editor-utils';

const { ENTITY_TYPES, ENTITY_MUTABILITY } = constants;

type AttachmentData = {
  id: string,
  mimeType: string,
  src: string,
  title: string
};
export default (editorState: EditorState, data: AttachmentData) => {
  let entityType;
  if (data.mimeType.startsWith('image/')) {
    entityType = ENTITY_TYPES.image;
  } else {
    entityType = ENTITY_TYPES.document;
  }

  const contentState = editorState.getCurrentContent();
  // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
  const contentStateWithEntity = contentState.createEntity(entityType, ENTITY_MUTABILITY.immutable, data);
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
  return EditorState.forceSelection(newEditorState, newEditorState.getCurrentContent().getSelectionAfter());
};