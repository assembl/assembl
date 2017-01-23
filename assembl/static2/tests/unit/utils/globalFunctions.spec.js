import React from 'react';
import GlobalFunctions from '../../../js/app/utils/globalFunctions';

describe('This test concern GlobalFunctions Class', () => {
  it('Should test the browser language', () => {
    const testedLocales = ['fr-FR', 'de-DE', 'de-AT', 'en-US', 'fr-fr', 'de-de', 'de-at', 'en-us', 'fr', 'de', 'ar', 'be'];
    const expectedResult = ['fr', 'de', 'de', 'en', 'fr', 'de', 'de', 'en', 'fr', 'de', 'en', 'en'];
    let result = [];
    for(let i in testedLocales){
      let locale = GlobalFunctions.getLocale(testedLocales[i]);
      result.push(locale);
    }
    expect(result).toEqual(expectedResult);
  });
  
  it('Should test locales available in translations object and different than the current locale', () => {
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
    const result = GlobalFunctions.getAvalaibleLocales(currentLocale, translations);
    expect(result).toEqual(expectedResult);
  });
});