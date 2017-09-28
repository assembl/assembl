import * as actions from '../../../js/app/actions/contentLocaleActions';

describe('Content locale actions', () => {
  describe('updateContentLocale action', () => {
    const { updateContentLocale } = actions;
    it('should return a updateContentLocale action', () => {
      const data = {
        'SWRlYTo2Mzg=': {
          contentLocale: 'fr',
          originalLocale: 'de'
        },
        'SWR2YTu4Xpq=': {
          contentLocale: 'fr',
          originalLocale: 'de'
        },
        'SWR2YPa8Puz=': {
          contentLocale: 'jp',
          originalLocale: 'en'
        }
      };
      const expected = {
        type: 'UPDATE_CONTENT_LOCALE',
        data: data
      };
      const actual = updateContentLocale(data);
      expect(actual).toEqual(expected);
    });
  });

  describe('updateContentLocaleById action', () => {
    const { updateContentLocaleById } = actions;
    it('should return a updateContentLocaleById action', () => {
      const expected = {
        type: 'UPDATE_CONTENT_LOCALE_BY_ID',
        id: 'SWRlYTo2Mzg',
        value: 'jp'
      };
      const actual = updateContentLocaleById('SWRlYTo2Mzg', 'jp');
      expect(actual).toEqual(expected);
    });
  });

  describe('updateContentLocaleByOriginalLocale action', () => {
    const { updateContentLocaleByOriginalLocale } = actions;
    it('should return a updateContentLocaleByOriginalLocale action', () => {
      const expected = {
        type: 'UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE',
        originalLocale: 'en',
        value: 'jp'
      };
      const actual = updateContentLocaleByOriginalLocale('en', 'jp');
      expect(actual).toEqual(expected);
    });
  });
});