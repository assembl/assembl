// @flow
import { AtomicBlockUtils, ContentState, EditorState } from 'draft-js';

export default {
  createEntity: function (type: DraftEntityType, mutability: DraftEntityMutability, data: Object) {
    const contentState = ContentState.createFromText('');
    // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
    const contentStateWithEntity = contentState.createEntity(type, mutability, data);
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    return contentState.getEntity(entityKey);
  },

  createDocumentEntity: function (data: Object) {
    return this.createEntity('DOCUMENT', 'IMMUTABLE', data);
  },

  createEditorStateWithTwoAttachments: function (imgSrc: string | File = 'my-img.png', fileSrc: string | File = 'my-file.pdf') {
    let contentState = ContentState.createFromText('');
    contentState = contentState.createEntity('IMAGE', 'IMMUTABLE', {
      id: 'my-img-id',
      mimeType: 'image/png',
      src: imgSrc,
      title: 'My image'
    });
    const imgEntityKey = contentState.getLastCreatedEntityKey();
    // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
    contentState = contentState.createEntity('DOCUMENT', 'IMMUTABLE', {
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