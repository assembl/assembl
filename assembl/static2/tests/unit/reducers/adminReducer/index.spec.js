import * as reducers from '../../../../js/app/reducers/adminReducer';

describe('Admin reducers', () => {
  describe('editLocale reducer', () => {
    const { editLocale } = reducers;
    it('should return the initial state', () => {
      expect(editLocale(undefined, {})).toEqual('fr');
    });

    it('should return state by default', () => {
      const state = 'en';
      const expected = 'en';
      const actual = editLocale(state, {});
      expect(actual).toEqual(expected);
    });

    it('should handle UPDATE_EDIT_LOCALE action type', () => {
      const state = 'en';
      const action = {
        type: 'UPDATE_EDIT_LOCALE',
        newLocale: 'fr'
      };
      const actual = editLocale(state, action);
      const expected = 'fr';
      expect(actual).toEqual(expected);
    });
  });
});