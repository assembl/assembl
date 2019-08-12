// @flow
import * as actions from '../../../../js/app/actions/adminActions';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('Admin actions', () => {
  describe('updateEditLocale action', () => {
    const { updateEditLocale } = actions;
    it('should return a UPDATE_EDIT_LOCALE action type', () => {
      const newLocale = 'de';

      const actual = updateEditLocale(newLocale);
      const expected = {
        newLocale: newLocale,
        type: actionTypes.UPDATE_EDIT_LOCALE
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('displayLanguageMenu action', () => {
    const { displayLanguageMenu } = actions;
    it('should return a UPDATE_LANGUAGE_MENU_VISIBILITY action type', () => {
      const state = true;

      const actual = displayLanguageMenu(state);
      const expected = {
        state: state,
        type: actionTypes.UPDATE_LANGUAGE_MENU_VISIBILITY
      };

      expect(actual).toEqual(expected);
    });
  });
});