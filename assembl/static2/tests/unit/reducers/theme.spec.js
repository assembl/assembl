// @flow
import * as actionTypes from '../../../js/app/actions/actionTypes';
import ThemeReducer from '../../../js/app/reducers/themeReducer';

describe('Theme reducers', () => {
  describe('ThemeReducer reducer', () => {
    const initialDefaultState = {
      firstColor: '#000000',
      secondColor: '#000000'
    };

    it('should return initial state', () => {
      const state = undefined;
      const action = {};

      const actual = ThemeReducer(state, action);
      const expected = initialDefaultState;

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = {
        firstColor: '#FF0000',
        secondColor: '#0000FF'
      };
      const action = { type: 'FOOBAR' };

      const actual = ThemeReducer(state, action);
      const expected = state;

      expect(actual).toEqual(expected);
    });

    it('should handle SET_THEME', () => {
      const state = initialDefaultState;
      const action = {
        firstColor: '#FF0000',
        secondColor: '#0000FF',
        type: actionTypes.SET_THEME
      };

      const actual = ThemeReducer(state, action);
      const expected = {
        firstColor: '#FF0000',
        secondColor: '#0000FF'
      };

      expect(actual).toEqual(expected);
    });
  });
});