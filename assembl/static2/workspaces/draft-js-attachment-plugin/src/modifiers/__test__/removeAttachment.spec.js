// @flow
import TestUtils from 'assembl-test-editor-utils';

import removeAttachment from '../removeAttachment';

describe('removeAttachment modifier', () => {
  it('should remove an attachment from editor state', () => {
    const editorState = TestUtils.createEditorStateWithTwoAttachments();

    const blocks = TestUtils.getBlocks(editorState);
    expect(blocks[3].getType()).toEqual('atomic');
    const removedBlockKey = blocks[3].getKey();
    expect(blocks).toHaveLength(5);
    const updatedEditorState = removeAttachment(editorState, removedBlockKey);

    const updatedBlocks = TestUtils.getBlocks(updatedEditorState);
    expect(updatedBlocks).toHaveLength(3);
    const updatedBlocksKeys = updatedBlocks.map(b => b.getKey());
    expect(updatedBlocksKeys).not.toContain(removedBlockKey);

    const lastBlockKey = updatedBlocksKeys[2];
    const selection = updatedEditorState.getSelection();
    expect(selection.getAnchorKey()).toEqual(lastBlockKey);
    expect(selection.getFocusKey()).toEqual(lastBlockKey);
  });
});