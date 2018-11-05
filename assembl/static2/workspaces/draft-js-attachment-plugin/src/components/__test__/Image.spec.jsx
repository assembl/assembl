// @flow
import React from 'react';
import renderer from 'react-test-renderer';
import { AtomicBlockUtils, ContentState, EditorState } from 'draft-js';

import { constants } from 'assembl-editor-utils';

import Image from '../Image';

const { ENTITY_MUTABILITY, ENTITY_TYPES } = constants;

function mockFileReader(img) {
  const addEventListener = jest.fn((_, evtHandler) => {
    evtHandler();
  });
  const readAsDataURLSpy = jest.fn();
  const DummyFileReader = {
    addEventListener: addEventListener,
    readAsDataURL: readAsDataURLSpy,
    result: img
  };
  global.FileReader = jest.fn(() => DummyFileReader);
  return DummyFileReader;
}

describe('Image component', () => {
  it('should render an image (url)', () => {
    let contentState = ContentState.createFromText('');
    // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
    contentState = contentState.createEntity(ENTITY_TYPES.image, ENTITY_MUTABILITY.immutable, {
      mimeType: 'image/png',
      src: 'my-img.png',
      title: 'My image'
    });
    const entityKey = contentState.getLastCreatedEntityKey();
    let editorState = EditorState.createWithContent(contentState);
    editorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
    contentState = editorState.getCurrentContent();
    const blocks = contentState.getBlocksAsArray();
    const atomicBlock = blocks[1];

    const props = {
      block: atomicBlock,
      contentState: contentState
    };
    const component = renderer.create(<Image {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an image (File)', () => {
    let contentState = ContentState.createFromText('');
    const img = window.btoa('gimme some base64');
    // $FlowFixMe DraftEntityType is too restrictive in DraftJS (see https://github.com/facebook/draft-js/issues/868 )
    const src = new File([img], 'foobar.jpg');
    const DummyFileReader = mockFileReader(img);
    contentState = contentState.createEntity(ENTITY_TYPES.image, ENTITY_MUTABILITY.immutable, {
      mimeType: 'image/png',
      src: src,
      title: 'My image'
    });
    const entityKey = contentState.getLastCreatedEntityKey();
    let editorState = EditorState.createWithContent(contentState);
    editorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, ' ');
    contentState = editorState.getCurrentContent();
    const blocks = contentState.getBlocksAsArray();
    const atomicBlock = blocks[1];

    const props = {
      block: atomicBlock,
      contentState: contentState
    };
    const component = renderer.create(<Image {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
    expect(DummyFileReader.readAsDataURL).toHaveBeenCalledWith(src);
  });
});