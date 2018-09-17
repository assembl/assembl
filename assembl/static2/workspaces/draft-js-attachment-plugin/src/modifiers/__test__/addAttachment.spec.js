// @flow
import { EditorState } from 'draft-js';

import addAttachment from '../addAttachment';

describe('addAttachment modifier', () => {
  it('should return a new editor state with a document', () => {
    const editorState = EditorState.createEmpty();
    const data = {
      mimeType: 'application/pdf',
      src: 'http://path/to/my/file.pdf',
      title: 'My pdf'
    };
    const newEditorState = addAttachment(editorState, data);
    const contentState = newEditorState.getCurrentContent();
    const entityKey = contentState.getLastCreatedEntityKey();
    const entity = contentState.getEntity(entityKey);
    expect(entity.getData()).toEqual({
      mimeType: 'application/pdf',
      src: 'http://path/to/my/file.pdf',
      title: 'My pdf'
    });
    expect(entity.getType()).toEqual('DOCUMENT');
    expect(entity.getMutability()).toEqual('IMMUTABLE');
    const firstBlock = contentState.getFirstBlock();
    expect(firstBlock.getText()).toEqual('');
    expect(firstBlock.getType()).toEqual('unstyled');

    const secondBlock = contentState.getBlockAfter(firstBlock.getKey());
    expect(secondBlock).not.toBeNull();
    if (!secondBlock) return; // make flow happy
    expect(secondBlock.getText()).toEqual(' ');
    expect(secondBlock.getType()).toEqual('atomic');
    const characterMetadata = secondBlock.characterList.get(0);
    expect(characterMetadata.entity).toEqual(entityKey);

    const thirdBlock = contentState.getBlockAfter(secondBlock.getKey());
    expect(thirdBlock).not.toBeNull();
    if (!thirdBlock) return; // make flow happy
    expect(thirdBlock.getText()).toEqual('');
    expect(thirdBlock.getType()).toEqual('unstyled');
  });

  it('should return a new editor state with an image', () => {
    const editorState = EditorState.createEmpty();
    const data = {
      mimeType: 'image/jpeg',
      src: 'http://path/to/my/image.jpg',
      title: 'My image'
    };
    const newEditorState = addAttachment(editorState, data);
    const contentState = newEditorState.getCurrentContent();
    const entityKey = contentState.getLastCreatedEntityKey();
    const entity = contentState.getEntity(entityKey);
    expect(entity.getData()).toEqual({
      mimeType: 'image/jpeg',
      src: 'http://path/to/my/image.jpg',
      title: 'My image'
    });
    expect(entity.getType()).toEqual('IMAGE');
    expect(entity.getMutability()).toEqual('IMMUTABLE');
    const firstBlock = contentState.getFirstBlock();
    expect(firstBlock.getText()).toEqual('');
    expect(firstBlock.getType()).toEqual('unstyled');

    const secondBlock = contentState.getBlockAfter(firstBlock.getKey());
    expect(secondBlock).not.toBeNull();
    if (!secondBlock) return; // make flow happy
    expect(secondBlock.getText()).toEqual(' ');
    expect(secondBlock.getType()).toEqual('atomic');
    const characterMetadata = secondBlock.characterList.get(0);
    expect(characterMetadata.entity).toEqual(entityKey);

    const thirdBlock = contentState.getBlockAfter(secondBlock.getKey());
    expect(thirdBlock).not.toBeNull();
    if (!thirdBlock) return; // make flow happy
    expect(thirdBlock.getText()).toEqual('');
    expect(thirdBlock.getType()).toEqual('unstyled');
  });
});