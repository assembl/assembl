import { Map } from 'immutable';

import contentLocale, { defaultContentLocaleMapping } from '../../../js/app/reducers/contentLocaleReducer';

describe('defaultContentLocaleMapping reducer', () => {
  it('should return initial state', () => {
    expect(defaultContentLocaleMapping(undefined, {})).toEqual(Map());
  });

  it('should return the state by default', () => {
    const stateBefore = Map({
      en: 'fr',
      fr: 'de'
    });
    expect(defaultContentLocaleMapping(stateBefore, {})).toEqual(stateBefore);
  });

  it('should handle UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE action type', () => {
    const stateBefore = Map({
      en: 'fr',
      fr: 'de'
    });
    const stateAfter = Map({
      en: 'fr',
      fr: 'en'
    });
    const action = {
      type: 'UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE',
      originalLocale: 'fr',
      value: 'en'
    };
    expect(defaultContentLocaleMapping(stateBefore, action)).toEqual(stateAfter);
  });
});

describe('contentLocale reducer', () => {
  it('should return initial state', () => {
    expect(contentLocale(undefined, {})).toEqual(Map());
  });

  it('should return state by default', () => {
    const stateBefore = Map({
      'SWRlYTo2Mzg=': Map({
        contentLocale: 'fr',
        originalLocale: 'de'
      })
    });
    expect(contentLocale(stateBefore, {})).toEqual(stateBefore);
  });

  it('should handle UPDATE_CONTENT_LOCALE_BY_ID action type', () => {
    const stateBefore = Map({
      'SWRlYTo2Mzg=': Map({
        contentLocale: 'fr',
        originalLocale: 'de'
      }),
      'SWR2YTu4Xpq=': Map({
        contentLocale: 'fr',
        originalLocale: 'de'
      }),
      'SWR2YPa8Puz=': Map({
        contentLocale: 'ja',
        originalLocale: 'en'
      })
    });
    const action = {
      type: 'UPDATE_CONTENT_LOCALE_BY_ID',
      id: 'SWR2YTu4Xpq=',
      value: 'eo'
    };
    const stateAfter = Map({
      'SWRlYTo2Mzg=': Map({
        contentLocale: 'fr',
        originalLocale: 'de'
      }),
      'SWR2YTu4Xpq=': Map({
        contentLocale: 'eo',
        originalLocale: 'de'
      }),
      'SWR2YPa8Puz=': Map({
        contentLocale: 'ja',
        originalLocale: 'en'
      })
    });
    expect(contentLocale(stateBefore, action)).toEqual(stateAfter);
  });

  it('should handle UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE action type', () => {
    const stateBefore = Map({
      'SWRlYTo2Mzg=': Map({
        contentLocale: 'es',
        originalLocale: 'de'
      }),
      'SWR2YTu4Xpq=': Map({
        contentLocale: 'es',
        originalLocale: 'de'
      }),
      'SWR2YPa8Puz=': Map({
        contentLocale: 'ja',
        originalLocale: 'en'
      })
    });
    const action = {
      type: 'UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE',
      originalLocale: 'de',
      value: 'eo'
    };
    const stateAfter = Map({
      'SWRlYTo2Mzg=': Map({
        contentLocale: 'eo',
        originalLocale: 'de'
      }),
      'SWR2YTu4Xpq=': Map({
        contentLocale: 'eo',
        originalLocale: 'de'
      }),
      'SWR2YPa8Puz=': Map({
        contentLocale: 'ja',
        originalLocale: 'en'
      })
    });
    expect(contentLocale(stateBefore, action)).toEqual(stateAfter);
  });

  it('should handle UPDATE_CONTENT_LOCALE action type', () => {
    const stateBefore = Map({
      'SWRlYTo2Mzg=': Map({
        contentLocale: 'es',
        originalLocale: 'de'
      }),
      'SWR2YTu4Xpq=': Map({
        contentLocale: 'es',
        originalLocale: 'de'
      }),
      'SWR2YPa8Puz=': Map({
        contentLocale: 'ja',
        originalLocale: 'en'
      })
    });
    const data = {
      'SWR2YPa8Puz=': {
        contentLocale: 'es',
        originalLocale: 'en'
      },
      'SWR3Bo2PLJ=': {
        contentLocale: 'ja',
        originalLocale: 'fr'
      }
    };
    const action = {
      type: 'UPDATE_CONTENT_LOCALE',
      data: data
    };
    const stateAfter = Map({
      'SWRlYTo2Mzg=': Map({
        contentLocale: 'es',
        originalLocale: 'de'
      }),
      'SWR2YTu4Xpq=': Map({
        contentLocale: 'es',
        originalLocale: 'de'
      }),
      'SWR2YPa8Puz=': Map({
        contentLocale: 'es',
        originalLocale: 'en'
      }),
      'SWR3Bo2PLJ=': Map({
        contentLocale: 'ja',
        originalLocale: 'fr'
      })
    });
    expect(contentLocale(stateBefore, action)).toEqual(stateAfter);
  });
});