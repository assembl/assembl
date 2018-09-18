// @flow
import { AtomicBlockUtils, ContentState, EditorState } from 'draft-js';

import getAttachments from '../getAttachments';

describe('getAttachments function', () => {
  it('should return an empty list if there are no attachments in editor state', () => {
    const editorState = EditorState.createEmpty();
    const actual = getAttachments(editorState);
    expect(actual).toEqual([]);
  });

  it('should return the list of attachments', () => {
    let contentState = ContentState.createFromText('');
    contentState = contentState.createEntity('IMAGE', 'IMMUTABLE', {
      mimeType: 'image/png',
      src: 'my-img.png',
      title: 'My image'
    });
    const imgEntityKey = contentState.getLastCreatedEntityKey();
    let editorState = EditorState.createWithContent(contentState);
    editorState = AtomicBlockUtils.insertAtomicBlock(editorState, imgEntityKey, ' ');

    // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
    contentState = contentState.createEntity('DOCUMENT', 'IMMUTABLE', {
      mimeType: 'application/pdf',
      src: 'my-file.pdf',
      title: 'My pdf'
    });
    const docEntityKey = contentState.getLastCreatedEntityKey();
    editorState = AtomicBlockUtils.insertAtomicBlock(editorState, docEntityKey, ' ');
    contentState = editorState.getCurrentContent();
    const blocks = contentState.getBlocksAsArray();

    const actual = getAttachments(editorState);
    const expected = [
      {
        blockKey: blocks[1].getKey(),
        entityKey: imgEntityKey,
        entityType: 'IMAGE',
        mimeType: 'image/png',
        title: 'My image',
        src: 'my-img.png'
      },
      {
        blockKey: blocks[3].getKey(),
        entityKey: docEntityKey,
        entityType: 'DOCUMENT',
        mimeType: 'application/pdf',
        src: 'my-file.pdf',
        title: 'My pdf'
      }
    ];
    expect(actual).toEqual(expected);
  });
});