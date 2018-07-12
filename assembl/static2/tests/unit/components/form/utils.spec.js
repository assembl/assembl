import * as utils from '../../../../js/app/components/form/utils';

describe('convertEntries function', () => {
  const { convertEntries } = utils;
  it('should convert langstring entries to an i18n value for forms', () => {
    const input = [
      { localeCode: 'en', value: 'Hello' },
      { localeCode: 'es', value: 'Hola' },
      { localeCode: 'fr', value: 'Salut' }
    ];
    const expected = {
      en: 'Hello',
      es: 'Hola',
      fr: 'Salut'
    };
    expect(convertEntries(input)).toEqual(expected);
  });
});

describe('getValidationState function', () => {
  const { getValidationState } = utils;
  it('should return the validation state for a field', () => {
    const error = 'This field is required';
    const touched = true;
    const expected = 'error';
    expect(getValidationState(error, touched)).toEqual(expected);
  });
});