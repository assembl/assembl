// @flow
import * as actionTypes from '../../../js/app/actions/actionTypes';
import TimelineReducer from '../../../js/app/reducers/timelineReducers';

describe('Timeline reducers', () => {
  describe('TimelineReducer reducer', () => {
    const initialDefaultState = null;

    it('should return initial state', () => {
      const state = undefined;
      const action = {};

      const actual = TimelineReducer(state, action);
      const expected = initialDefaultState;

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = { stateIsNeverUsed: 'state is never used' };
      const action = { type: 'FOOBAR' };

      const actual = TimelineReducer(state, action);
      const expected = state;

      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_TIMELINE', () => {
      const state = initialDefaultState;
      const action = {
        timeline: 'a timeline string',
        type: actionTypes.UPDATE_TIMELINE
      };

      const actual = TimelineReducer(state, action);
      const expected = 'a timeline string';

      expect(actual).toEqual(expected);
    });
  });
});