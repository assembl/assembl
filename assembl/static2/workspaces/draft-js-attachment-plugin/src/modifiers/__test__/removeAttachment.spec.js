// @flow
import { AtomicBlockUtils, ContentState, EditorState } from 'draft-js';

import removeAttachment from '../removeAttachment';

function createEditorStateWithTwoAttachments() {
  let contentState = ContentState.createFromText('');
  contentState = contentState.createEntity('IMAGE', 'IMMUTABLE', {
    mimeType: 'image/png',
    src: 'my-img.png',
    title: 'My image'
  });
  const imgEntityKey = contentState.getLastCreatedEntityKey();
  // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
  contentState = contentState.createEntity('DOCUMENT', 'IMMUTABLE', {
    mimeType: 'application/pdf',
    src: 'my-file.pdf',
    title: 'My pdf'
  });
  const docEntityKey = contentState.getLastCreatedEntityKey();

  let editorState = EditorState.createWithContent(contentState);
  editorState = AtomicBlockUtils.insertAtomicBlock(editorState, imgEntityKey, ' ');
  editorState = AtomicBlockUtils.insertAtomicBlock(editorState, docEntityKey, ' ');
  return editorState;
}

function getBlocks(editorState) {
  return editorState.getCurrentContent().getBlocksAsArray();
}

describe('removeAttachment modifier', () => {
  it('should remove an attachment from editor state', () => {
    const editorState = createEditorStateWithTwoAttachments();

    const blocks = getBlocks(editorState);
    expect(blocks[3].getType()).toEqual('atomic');
    const removedBlockKey = blocks[3].getKey();
    expect(blocks).toHaveLength(5);
    const updatedEditorState = removeAttachment(editorState, removedBlockKey);

    const updatedBlocks = getBlocks(updatedEditorState);
    expect(updatedBlocks).toHaveLength(3);
    const updatedBlocksKeys = updatedBlocks.map(b => b.getKey());
    expect(updatedBlocksKeys).not.toContain(removedBlockKey);

    const lastBlockKey = updatedBlocksKeys[2];
    const selection = updatedEditorState.getSelection();
    expect(selection.getAnchorKey()).toEqual(lastBlockKey);
    expect(selection.getFocusKey()).toEqual(lastBlockKey);
  });
});