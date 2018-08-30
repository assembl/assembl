import { ContentState, EditorState, Modifier } from 'draft-js';
import React from 'react';
import renderer from 'react-test-renderer';

import { TestEditorUtils } from 'assembl-editor-utils';

import LinkButton from '../LinkButton';

const { createSelectionState } = TestEditorUtils;

describe('LinkButton component', () => {
  it('should render a link button', () => {
    const editorState = EditorState.createEmpty();
    const getEditorStateMock = () => editorState;
    const setEditorStateSpy = jest.fn();
    const onRemoveLinkAtSelectionSpy = jest.fn();
    const props = {
      modal: {
        current: null
      },
      onRemoveLinkAtSelection: onRemoveLinkAtSelectionSpy,
      store: {
        getEditorState: getEditorStateMock,
        setEditorState: setEditorStateSpy
      },
      theme: {
        button: 'btn',
        buttonWrapper: 'btn-group'
      }
    };
    const component = renderer.create(<LinkButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an active LinkButton if selection is on a link', () => {
    let contentState = ContentState.createFromText('I will input the solid state PNG port');
    contentState = contentState.createEntity('LINK', 'MUTABLE', {
      target: '_blank',
      title: 'My link',
      url: 'https://en.wikipedia.org/wiki/Portable_Network_Graphics'
    });
    const contentBlock = contentState.getFirstBlock();
    const blockKey = contentBlock.getKey();
    const selection = createSelectionState(blockKey, '0', '4');
    const linkEntityKey = contentState.getLastCreatedEntityKey();
    contentState = Modifier.applyEntity(contentState, selection, linkEntityKey);
    const editorState = EditorState.createWithContent(contentState);
    const getEditorStateMock = () => editorState;
    const setEditorStateSpy = jest.fn();
    const onRemoveLinkAtSelectionSpy = jest.fn();
    const props = {
      modal: {
        current: null
      },
      onRemoveLinkAtSelection: onRemoveLinkAtSelectionSpy,
      store: {
        getEditorState: getEditorStateMock,
        setEditorState: setEditorStateSpy
      },
      theme: {
        button: 'btn',
        buttonWrapper: 'btn-group'
      }
    };
    const component = renderer.create(<LinkButton {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  // TODO: test that modal is rendered in portal
  it('should render a link button with an opened modal');
});