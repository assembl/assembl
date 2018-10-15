// @flow
import { createSelectionState } from '../selection';

describe('createSelectionState function', () => {
  it('should create a new selection state', () => {
    const selectionState = createSelectionState('42', 3, 6);
    const expected = 'Anchor: 42:3, Focus: 42:6, Is Backward: false, Has Focus: false';
    expect(selectionState.serialize()).toEqual(expected);
  });
});