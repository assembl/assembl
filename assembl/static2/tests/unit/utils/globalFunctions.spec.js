import React from 'react';
import GlobalFunctions from '../../../js/app/utils/globalFunctions';

describe('This test concern GlobalFunctions Class', () => {
  it('Should test the browser language', () => {
    const testedLocales = ['fr-FR', 'de-DE', 'de-AT', 'en-US', 'fr-fr', 'de-de', 'de-at', 'en-us', 'fr', 'de', 'ar', 'be'];
    const expectedResult = ['fr', 'en', 'en', 'en', 'fr', 'en', 'en', 'en', 'fr', 'en', 'en', 'en'];
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

  it('Should transform a string to a date', () => {
    const strArray = ['2017-02-14T23:59:59Z', '2017-03-31T23:59:59Z', '2017-11-01T23:59:59Z'];
    const result = [];
    const expectedResult = ['Tue Feb 14 2017 23:59:59 GMT+0100 (CET)', 'Fri Mar 31 2017 23:59:59 GMT+0200 (CEST)', 'Wed Nov 01 2017 23:59:59 GMT+0100 (CET)'];
    strArray.map((str) => {
      let date = GlobalFunctions.getDateFromString(str);
      result.push(String(date));
    });
    expect(result).toEqual(expectedResult);
  });
    
  it('Should compare 2 dates and return true if the first date is more recent than the second', () => {
    const currentDate = new Date();
    const strArray = ['2003-01-01T00:00:00Z', '2137-01-01T00:00:00Z', '2015-11-01T14:05:23Z', '2079-01-01T00:00:00Z'];
    const result = [];
    const expectedResult = [true, false, true, false];
    strArray.map((str) => {
      let date = GlobalFunctions.getDateFromString(str);
      let isDateExpired = GlobalFunctions.isDateExpired(currentDate, date);
      result.push(isDateExpired);
    });
    expect(result).toEqual(expectedResult);
  });
  
  it('Should return the number of days between 2 dates', () => {
    const result = [];
    const expectedResult = [14, 31, 90, 92, 365];
    const datesArray = [
      {
        date1:'2017-02-14T00:00:00Z',
        date2:'2017-02-28T00:00:00Z'
      },
      {
        date1:'2017-03-01T00:00:00Z',
        date2:'2017-04-01T00:00:00Z'
      },
      {
        date1:'2017-01-01T00:00:00Z',
        date2:'2017-04-01T00:00:00Z'
      },
      {
        date1:'2017-05-01T00:00:00Z',
        date2:'2017-08-01T00:00:00Z'
      },
      {
        date1:'2017-01-01T00:00:00Z',
        date2:'2018-01-01T00:00:00Z'
      }
    ];
    datesArray.map((elm) => {
      const date1 = GlobalFunctions.getDateFromString(elm.date1);
      const date2 = GlobalFunctions.getDateFromString(elm.date2);
      const days = GlobalFunctions.getNumberOfDays(date2, date1);
      result.push(days);
    });
    expect(result).toEqual(expectedResult);
  });
  
  it('Should return a percentage', () => {
    const result = [];
    const expectedResult = [43.48, 7.49, 7.8];
    const arr = [
      {
        value: 10,
        total: 23
      },
      {
        value: 32,
        total: 427
      },
      {
        value: 684,
        total: 8765
      }
    ];
    arr.map((elm) => {
      const percentage = GlobalFunctions.calculatePercentage(elm.value, elm.total);
      result.push(percentage);
    });
    expect(result).toEqual(expectedResult);
  });
});
  