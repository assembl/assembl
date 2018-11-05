import { convertToLangstringEntries, getLocale, getAvailableLocales } from '../../../js/app/utils/i18n';

describe('i18n util module', () => {
  describe('getLocale function', () => {
    it('should return the browser language', () => {
      const testedLocales = ['fr-FR', 'de-DE', 'de-AT', 'en-US', 'fr-fr', 'de-de', 'de-at', 'en-us', 'fr', 'de', 'ar', 'be'];
      const expectedResult = ['fr', 'de', 'de', 'en', 'fr', 'de', 'de', 'en', 'fr', 'de', 'en', 'en'];
      const result = testedLocales.map(testedLocale => getLocale(testedLocale));
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getAvailableLocales function', () => {
    it('should ensure that locales available in translations object are different than the current locale', () => {
      const translations = {
        de: {
          test: 'test'
        },
        en: {
          test: 'test'
        },
        fr: {
          test: 'test'
        }
      };
      const currentLocale = 'fr';
      const expectedResult = ['de', 'en'];
      const result = getAvailableLocales(currentLocale, translations);
      expect(result).toEqual(expectedResult);
    });
  });

  xdescribe('updateInLangstringEntries function', () => {
    it('should return an updater function to update a value in langstring entries', () => {});
  });

  xdescribe('getEntryValueForLocale function', () => {
    it('should return the value for the langstring entry with given locale', () => {});
  });

  describe('convertToLangstringEntries function', () => {
    it('should convert a string to a list of langstring entries', () => {
      const actual = convertToLangstringEntries('bypassing the interface', 'en');
      const expected = [{ localeCode: 'en', value: 'bypassing the interface' }];
      expect(actual).toEqual(expected);
    });
  });
});