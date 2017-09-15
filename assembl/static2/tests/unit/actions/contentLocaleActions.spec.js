import * as actions from '../../../js/app/actions/contentLocaleActions';

describe('Content locale actions', () => {
  describe('setContentLocale action', () => {
    const { setContentLocale } = actions;
    it('should return a SetContentLocale action', () => {
      const expected = {
        type: 'SET_CONTENT_LOCALE',
        originalLocale: 'fr',
        value: 'jp'
      };
      const actual = setContentLocale('fr', 'jp');
      expect(actual).toEqual(expected);
    });
  });
});