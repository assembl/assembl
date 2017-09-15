import { Map } from 'immutable';

import contentLocale from '../../../js/app/reducers/contentLocaleReducer';

describe('contentLocale reducer', () => {
  it('should return initial state', () => {
    expect(contentLocale(undefined, {})).toEqual(Map());
  });

  it('should return state by default', () => {
    const stateBefore = Map({
      de: 'fr'
    });
    expect(contentLocale(stateBefore, {})).toEqual(stateBefore);
  });

  it('should handle SET_CONTENT_LOCALE action type', () => {
    const stateBefore = Map({
      de: undefined,
      en: undefined,
      fr: 'de'
    });
    const action = {
      type: 'SET_CONTENT_LOCALE',
      originalLocale: 'fr',
      value: 'en'
    };
    const stateAfter = Map({
      de: undefined,
      en: undefined,
      fr: 'en'
    });
    expect(contentLocale(stateBefore, action)).toEqual(stateAfter);
  });
});