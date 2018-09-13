// @flow
import { ContentState, EditorState, RichUtils } from 'draft-js';

import EditorUtils from '../index';
import { createSelectionState } from '../selection';

describe('EditorUtils', () => {
  describe('createLinkAtSelection function', () => {
    it('should create a link entity with given data', () => {
      const editorState = EditorState.createEmpty();
      const actual = EditorUtils.createLinkAtSelection(editorState, {
        target: '_blank',
        text: 'GNU',
        title: 'GNU',
        url: 'http://www.gnu.org'
      });
      const entityKey = actual.getCurrentContent().getLastCreatedEntityKey();
      const entity = actual.getCurrentContent().getEntity(entityKey);
      expect(entity.type).toBe('LINK');
      expect(entity.data.target).toBe('_blank');
      expect(entity.data.title).toBe('GNU');
      expect(entity.data.url).toBe('http://www.gnu.org');
    });
  });

  it('should replace selection by given text', () => {
    const contentState = ContentState.createFromText('Use the wireless SMS matrix');
    const contentBlock = contentState.getFirstBlock();
    const selection = createSelectionState(contentBlock.getKey(), 4, 27);
    const editorState = EditorState.acceptSelection(EditorState.createWithContent(contentState), selection);
    const actual = EditorUtils.createLinkAtSelection(editorState, {
      target: undefined,
      title: 'GNU',
      text: 'GNU',
      url: 'http://www.gnu.org'
    });
    expect(actual.getCurrentContent().getPlainText()).toEqual('Use GNU');
    const entityKey = actual
      .getCurrentContent()
      .getFirstBlock()
      .getEntityAt(4);

    const entity = actual.getCurrentContent().getEntity(entityKey);
    expect(entity.data.url).toEqual('http://www.gnu.org');
  });

  describe('replaceLinkAtCursor function', () => {
    it('should replace text and entity data', () => {
      let contentState = ContentState.createFromText('Use Google');
      contentState = contentState.createEntity('LINK', 'MUTABLE', {
        target: '_blank',
        text: 'Google',
        title: 'Google',
        url: 'http://www.google.com'
      });
      const contentBlock = contentState.getFirstBlock();
      const entityKey = contentState.getLastCreatedEntityKey();
      const selection = createSelectionState(contentBlock.getKey(), 4, 10);
      let editorState = EditorState.createWithContent(contentState);
      editorState = RichUtils.toggleLink(editorState, selection, entityKey);

      // we only have a cursor position
      const newSelection = createSelectionState(contentBlock.getKey(), 8, 8);
      editorState = EditorState.forceSelection(editorState, newSelection);

      const actual = EditorUtils.replaceLinkAtCursor(editorState, {
        target: '_blank',
        text: 'GNU',
        title: 'GNU',
        url: 'http://www.gnu.org'
      });
      expect(actual.getCurrentContent().getPlainText()).toEqual('Use GNU');
      const newEntityKey = actual
        .getCurrentContent()
        .getFirstBlock()
        .getEntityAt(5);
      const newEntity = actual.getCurrentContent().getEntity(newEntityKey);
      expect(newEntity.getData()).toEqual({
        target: '_blank',
        text: 'GNU',
        title: 'GNU',
        url: 'http://www.gnu.org'
      });
    });
  });
});