import { List } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes';
import * as reducers from '../../../../js/app/reducers/adminReducer/adminSections';

describe('sectionsInOrder reducer', () => {
  const { sectionsInOrder } = reducers;
  it('should return initial state', () => {
    const state = undefined;
    const action = {};
    const actual = sectionsInOrder(state, action);
    const expected = List();
    expect(actual).toEqual(expected);
  });

  it('should return state for all other actions', () => {
    const state = List.of('1', '2', '3');
    const action = {
      type: 'FOOBAR'
    };
    const actual = sectionsInOrder(state, action);
    const expected = state;
    expect(actual).toEqual(expected);
  });

  it('should handle CREATE_SECTION', () => {
    const state = List.of('1', '2', '3');
    const action = {
      id: '4',
      type: actionTypes.CREATE_SECTION
    };
    const actual = sectionsInOrder(state, action);
    const expected = List.of('1', '2', '3', '4');
    expect(actual).toEqual(expected);
  });

  it('should handle DELETE_SECTION', () => {
    const state = List.of('1', '2', '3');
    const action = {
      id: '2',
      type: actionTypes.DELETE_SECTION
    };
    const actual = sectionsInOrder(state, action);
    const expected = List.of('1', '3');
    expect(actual).toEqual(expected);
  });

  it('should handle UPDATE_SECTIONS', () => {
    const state = List.of('1', '2', '3');
    const action = {
      sections: [{ id: '42' }],
      type: actionTypes.UPDATE_SECTIONS
    };
    const actual = sectionsInOrder(state, action);
    const expected = List.of('42');
    expect(actual).toEqual(expected);
  });

  it('should handle MOVE_UP_SECTION', () => {
    const state = List.of('1', '2', '3');
    const action = {
      id: '2',
      type: actionTypes.MOVE_UP_SECTION
    };
    const actual = sectionsInOrder(state, action);
    const expected = List.of('2', '1', '3');
    expect(actual).toEqual(expected);
  });

  it('should handle MOVE_DOWN_SECTION', () => {
    const state = List.of('1', '2', '3');
    const action = {
      id: '2',
      type: actionTypes.MOVE_DOWN_SECTION
    };
    const actual = sectionsInOrder(state, action);
    const expected = List.of('1', '3', '2');
    expect(actual).toEqual(expected);
  });
});