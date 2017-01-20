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
});