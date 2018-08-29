// @flow
import { SelectionState } from 'draft-js';

export function createSelectionState(blockKey: string, startOffset: string, endOffset: string): SelectionState {
  return SelectionState.createEmpty(blockKey).merge({
    anchorKey: blockKey,
    anchorOffset: startOffset,
    focusKey: blockKey,
    focusOffset: endOffset
  });
}