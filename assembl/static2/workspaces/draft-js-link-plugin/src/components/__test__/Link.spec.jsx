import React from 'react';
import renderer from 'react-test-renderer';
import { ContentState, EditorState, Modifier, SelectionState } from 'draft-js';

import Link from '../Link';

describe('Link component', () => {
  it('should render a link', () => {
    // create an editor state with a link entity
    let contentState = ContentState.createFromText('I will input the solid state PNG port');
    contentState = contentState.createEntity('LINK', 'MUTABLE', {
      target: '_blank',
      title: 'My link',
      url: 'https://en.wikipedia.org/wiki/Portable_Network_Graphics'
    });
    const contentBlock = contentState.getFirstBlock();
    const blockKey = contentBlock.getKey();
    const selection = SelectionState.createEmpty(blockKey).merge({
      anchorKey: blockKey,
      anchorOffset: '30',
      focusKey: blockKey,
      focusOffset: '32'
    });
    const entityKey = contentState.getLastCreatedEntityKey();
    contentState = Modifier.applyEntity(contentState, selection, entityKey);
    let editorState = EditorState.createWithContent(contentState);
    editorState = EditorState.acceptSelection(editorState, selection);

    const getEditorStateMock = () => editorState;
    const props = {
      children: 'PNG',
      className: 'link',
      entityKey: entityKey,
      getEditorState: getEditorStateMock
    };
    const component = renderer.create(<Link {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});