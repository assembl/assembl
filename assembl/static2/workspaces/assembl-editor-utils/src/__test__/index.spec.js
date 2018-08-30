import { ContentState, EditorState } from 'draft-js';

import EditorUtils from '../index';
import TestUtils from '../TestUtils';

const { createSelectionState } = TestUtils;

describe('EditorUtils', () => {
  describe('createLinkAtSelection function', () => {
    it('should create a link entity with given data', () => {
      const editorState = EditorState.createEmpty();
      const actual = EditorUtils.createLinkAtSelection(editorState, {
        target: '_blank',
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
    const actual = EditorUtils.createLinkAtSelection(editorState, { text: 'GNU', url: 'http://www.gnu.org' });
    expect(actual.getCurrentContent().getPlainText()).toEqual('Use GNU');
    const entityKey = actual
      .getCurrentContent()
      .getFirstBlock()
      .getEntityAt(4);

    const entity = actual.getCurrentContent().getEntity(entityKey);
    expect(entity.data.url).toEqual('http://www.gnu.org');
  });
});