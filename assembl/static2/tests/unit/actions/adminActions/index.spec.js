import * as actions from '../../../../js/app/actions/adminActions';

describe('Admin actions', () => {
  describe('updateEditLocale action', () => {
    const { updateEditLocale } = actions;
    it('should return a UPDATE_EDIT_LOCALE action type', () => {
      const expected = {
        newLocale: 'de',
        type: 'UPDATE_EDIT_LOCALE'
      };
      const actual = updateEditLocale('de');
      expect(actual).toEqual(expected);
    });
  });
});