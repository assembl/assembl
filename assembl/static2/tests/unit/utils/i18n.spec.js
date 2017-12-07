import { getLocale, getAvailableLocales } from '../../../js/app/utils/i18n';

describe('i18n util module', () => {
  describe('getLocale function', () => {
    it('should return the browser language', () => {
      const testedLocales = ['fr-FR', 'de-DE', 'de-AT', 'en-US', 'fr-fr', 'de-de', 'de-at', 'en-us', 'fr', 'de', 'ar', 'be'];
      const expectedResult = ['fr', 'en', 'en', 'en', 'fr', 'en', 'en', 'en', 'fr', 'en', 'en', 'en'];
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

  describe('updateInLangstringEntries function', () => {
    it('should return an updater function to update a value in langstring entries');
  });

  describe('getEntryValueForLocale function', () => {
    it('should return the value for the langstring entry with given locale');
  });
});