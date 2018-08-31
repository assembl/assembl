// @flow
import { SelectionState } from 'draft-js';

export default {
  createSelectionState: function (blockKey: string, startOffset: string, endOffset: string): SelectionState {
    return SelectionState.createEmpty(blockKey).merge({
      anchorKey: blockKey,
      anchorOffset: startOffset,
      focusKey: blockKey,
      focusOffset: endOffset
    });
  }
};