// @flow
import { SelectionState } from 'draft-js';

export function createSelectionState(blockKey: string, startOffset: number, endOffset: number): SelectionState {
  return SelectionState.createEmpty(blockKey).merge({
    anchorKey: blockKey,
    anchorOffset: startOffset,
    focusKey: blockKey,
    focusOffset: endOffset
  });
}