// @flow
import { type EditorState } from 'draft-js';

import { getSelectedBlock } from './blocks';

type EntityRange = null | {
  start: number,
  end: number
};
export function getEntityRange(editorState: EditorState, entityKey: string): EntityRange {
  let entityRange = null;
  const block = getSelectedBlock(editorState);
  block.findEntityRanges(
    (character) => {
      const currentEntityKey = character.getEntity();
      return currentEntityKey !== null && currentEntityKey === entityKey;
    },
    (start, end) => {
      entityRange = { start: start, end: end };
    }
  );

  return entityRange;
}