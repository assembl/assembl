import React from 'react';
import Context from '../../../js/app/utils/context';

describe('This test concern Context Class', () => {
  it('Should test the browser language', () => {
    const testedLocales = ['fr-FR', 'de-DE', 'de-AT', 'en-US', 'fr-fr', 'de-de', 'de-at', 'en-us', 'fr', 'de', 'ar', 'be'];
    const expectedResult = ['fr', 'de', 'de', 'en', 'fr', 'de', 'de', 'en', 'fr', 'de', 'en', 'en'];
    let result = [];
    for(let i in testedLocales){
        let locale = Context.getLocale(testedLocales[i]);
        result.push(locale);
    }
    expect(result).toEqual(expectedResult);
  });
});