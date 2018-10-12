// @flow
import { ContentState, EditorState, Modifier } from 'draft-js';

import { ENTITY_MUTABILITY, ENTITY_TYPES } from '../constants';
import { getEntityRange } from '../entities';
import { createSelectionState } from '../selection';

describe('getEntityRange function', () => {
  it('should return null if entity is not found', () => {
    const editorState = EditorState.createEmpty();
    const actual = getEntityRange(editorState, '0');
    expect(actual).toBeNull();
  });

  it('should get the range (start/end offsets) of this entity', () => {
    let contentState = ContentState.createFromText('we need to connect the bluetooth SSL capacitor!').createEntity(
      ENTITY_TYPES.link,
      ENTITY_MUTABILITY.mutable,
      {}
    );
    const block = contentState.getFirstBlock();
    const entityKey = contentState.getLastCreatedEntityKey();
    const selection = createSelectionState(block.getKey(), 2, 8);
    contentState = Modifier.applyEntity(contentState, selection, entityKey);
    const editorState = EditorState.createWithContent(contentState);

    const actual = getEntityRange(editorState, entityKey);
    expect(actual).not.toBeNull();
    if (actual !== null) {
      expect(actual.start).toEqual(2);
      expect(actual.end).toEqual(8);
    }
  });
});