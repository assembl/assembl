import contentLocale from '../../../js/app/reducers/contentLocaleReducer';

describe('contentLocale reducer', () => {
  it('should return initial state', () => {
    expect(contentLocale(undefined, {})).toEqual('fr');
  });

  it('should return state by default', () => {
    expect(contentLocale('de', {})).toEqual('de');
  });

  it('should handle SET_CONTENT_LOCALE action type', () => {
    const action = {
      type: 'SET_CONTENT_LOCALE',
      value: 'en'
    };
    expect(contentLocale('fr', action)).toEqual('en');
  });
});