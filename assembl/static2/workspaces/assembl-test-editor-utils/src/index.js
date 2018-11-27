// @flow
import { AtomicBlockUtils, ContentState, EditorState } from 'draft-js';

import { constants } from 'assembl-editor-utils';

const { ENTITY_MUTABILITY, ENTITY_TYPES } = constants;

export default {
  createEntity: function (type: DraftEntityType, mutability: DraftEntityMutability, data: Object) {
    const contentState = ContentState.createFromText('');
    // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
    const contentStateWithEntity = contentState.createEntity(type, mutability, data);
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    return contentState.getEntity(entityKey);
  },

  createDocumentEntity: function (data: Object) {
    return this.createEntity(ENTITY_TYPES.document, ENTITY_MUTABILITY.immutable, data);
  },

  createEditorStateWithTwoAttachments: function (
    imgSrc: string | File = 'my-img.png',
    fileSrc: string | File = 'my-file.pdf',
    text: string = ''
  ) {
    let contentState = ContentState.createFromText(text);
    contentState = contentState.createEntity(ENTITY_TYPES.image, ENTITY_MUTABILITY.immutable, {
      id: 'my-img-id',
      mimeType: 'image/png',
      src: imgSrc,
      title: 'My image'
    });
    const imgEntityKey = contentState.getLastCreatedEntityKey();
    // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
    contentState = contentState.createEntity(ENTITY_TYPES.document, ENTITY_MUTABILITY.immutable, {
      id: 'my-doc-id',
      mimeType: 'application/pdf',
      src: fileSrc,
      title: 'My document'
    });
    const docEntityKey = contentState.getLastCreatedEntityKey();

    let editorState = EditorState.createWithContent(contentState);
    editorState = AtomicBlockUtils.insertAtomicBlock(editorState, imgEntityKey, ' ');
    editorState = AtomicBlockUtils.insertAtomicBlock(editorState, docEntityKey, ' ');
    return editorState;
  },

  getBlocks: function (editorState: EditorState) {
    return editorState.getCurrentContent().getBlocksAsArray();
  }
};