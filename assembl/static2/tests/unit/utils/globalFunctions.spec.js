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
  
  it('Should return an array sorted by dates', () => {
    const object = [
      {
        id: "1",
        text: "text1",
        creation_date: "2014-01-20T16:01:29Z"
      },
      {
        id: "2",
        text: "text2",
        creation_date: "2014-05-22T14:35:44Z"
      },
      {
        id: "3",
        text: "text3",
        creation_date: "2014-05-22T14:37:44Z"
      },
      {
        id: "4",
        text: "text4",
        creation_date: "2014-05-22T15:29:51Z"
      },
      {
        id: "5",
        text: "text5",
        creation_date: "2014-05-22T15:30:21Z"
      },
      {
        id: "6",
        text: "text6",
        creation_date: "2014-06-02T14:29:58Z"
      },
      {
        id: "7",
        text: "text7",
        creation_date: "2014-06-03T03:13:05Z"
      },
      {
        id: "8",
        text: "text8",
        creation_date: "2014-06-03T03:14:55Z"
      },
      {
        id: "8",
        text: "text8",
        creation_date: "2017-02-14T20:15:50.154885Z"
      }
    ];
    const key = "creation_date";
    const expectedResult = [1390233689000, 1400769344000, 1400769464000, 1400772591000, 1400772621000, 1401719398000, 1401765185000, 1401765295000, 1487103350154];
    const result = GlobalFunctions.getSortedDate(object, key);
    expect(result).toEqual(expectedResult);
  });
});