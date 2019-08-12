// @flow
import * as reducers from '../../../../js/app/reducers/adminReducer';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('index admin reducers', () => {
  describe('editLocale reducer', () => {
    const { editLocale } = reducers;
    const initialDefaultState = 'fr';
    it('should return the initial state', () => {
      const state = undefined;
      const action = {};

      const actual = editLocale(state, action);
      const expected = 'fr';

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = initialDefaultState;
      const action = { type: 'FOOBAR' };

      const actual = editLocale(state, action);
      const expected = 'fr';

      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_EDIT_LOCALE', () => {
      const state = initialDefaultState;
      const action = {
        type: actionTypes.UPDATE_EDIT_LOCALE,
        newLocale: 'en'
      };

      const actual = editLocale(state, action);
      const expected = 'en';

      expect(actual).toEqual(expected);
    });
  });

  describe('displayLanguageMenu reducer', () => {
    const { displayLanguageMenu } = reducers;
    const initialDefaultState = false;
    it('should return the initial state', () => {
      const state = undefined;
      const action = {};

      const actual = displayLanguageMenu(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });

    it('should return state for all other actions', () => {
      const state = initialDefaultState;
      const action = { type: 'FOOBAR' };

      const actual = displayLanguageMenu(state, action);
      const expected = false;

      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_LANGUAGE_MENU_VISIBILITY', () => {
      const state = initialDefaultState;
      const action = {
        type: actionTypes.UPDATE_LANGUAGE_MENU_VISIBILITY,
        state: true
      };

      const actual = displayLanguageMenu(state, action);
      const expected = true;

      expect(actual).toEqual(expected);
    });
  });
});