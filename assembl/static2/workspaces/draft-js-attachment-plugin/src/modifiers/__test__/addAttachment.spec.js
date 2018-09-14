// @flow
import { EditorState } from 'draft-js';

import addAttachment from '../addAttachment';

describe('addAttachment modifier', () => {
  it('should return a new editor state with an image', () => {
    const editorState = EditorState.createEmpty();
    const data = {
      src: 'http://path/to/my/image.jpg'
    };
    const newEditorState = addAttachment(editorState, data);
    const contentState = newEditorState.getCurrentContent();
    const entityKey = contentState.getLastCreatedEntityKey();
    const entity = contentState.getEntity(entityKey);
    expect(entity.getData()).toEqual({
      src: 'http://path/to/my/image.jpg'
    });
    expect(entity.getType()).toEqual('IMAGE');
    expect(entity.getMutability()).toEqual('IMMUTABLE');
    const firstBlock = contentState.getFirstBlock();
    expect(firstBlock.getText()).toEqual('');
    expect(firstBlock.getType()).toEqual('unstyled');

    const secondBlock = contentState.getBlockAfter(firstBlock.getKey());
    expect(secondBlock.getText()).toEqual(' ');
    expect(secondBlock.getType()).toEqual('atomic');
    const characterMetadata = secondBlock.characterList.get(0);
    expect(characterMetadata.entity).toEqual(entityKey);

    const thirdBlock = contentState.getBlockAfter(secondBlock.getKey());
    expect(thirdBlock.getText()).toEqual('');
    expect(thirdBlock.getType()).toEqual('unstyled');
  });
});