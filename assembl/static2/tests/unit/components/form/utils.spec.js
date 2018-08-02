import * as utils from '../../../../js/app/components/form/utils';
import { displayAlert } from '../../../../js/app/utils/utilityManager';

jest.mock('../../../../js/app/utils/utilityManager');

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

describe('createSave function', () => {
  const { createSave } = utils;
  it('should return a save function to be used in LoadSaveReinitializeForm with OK status', async () => {
    const save = createSave('yes');
    const promises = [() => Promise.resolve()];
    const status = await save(promises);
    expect(status).toEqual('OK');
    expect(displayAlert).toHaveBeenCalledWith('success', 'yes');
  });

  it('should return a save function to be used in LoadSaveReinitializeForm with KO status', async () => {
    const save = createSave('no');
    const promises = [
      () =>
        Promise.reject({
          message: 'houston we have a problem'
        })
    ];
    const status = await save(promises);
    expect(status).toEqual('KO');
    expect(displayAlert).toHaveBeenCalledWith('danger', 'houston we have a problem', false, 30000);
  });
});

describe('convertToEntries function', () => {
  const { convertToEntries } = utils;
  it('should convert a i18n value in langstring entries', () => {
    const input = {
      en: 'Hello',
      fr: 'Bonjour'
    };
    const actual = convertToEntries(input);
    const expected = [{ localeCode: 'en', value: 'Hello' }, { localeCode: 'fr', value: 'Bonjour' }];
    expect(actual).toEqual(expected);
  });
});

describe('getFileVariable function', () => {
  const { getFileVariable } = utils;
  it('should return a file variable from a file value', () => {
    const file = new File([''], 'foo.jpg', { type: 'image/jpeg' });
    const input = {
      externalUrl: file,
      mimeType: 'image/jpeg',
      title: 'foo.jpg'
    };
    const actual = getFileVariable(input);
    const expected = file;
    expect(actual).toEqual(expected);
  });

  it('should return \'TO_DELETE\' if file has been removed', () => {
    const file = new File([''], 'foo.jpg', { type: 'image/jpeg' });
    const img = '';
    const initialImg = {
      externalUrl: file,
      mimeType: 'image/jpeg',
      title: 'foo.jpg'
    };
    const actual = getFileVariable(img, initialImg);
    const expected = 'TO_DELETE';
    expect(actual).toEqual(expected);
  });
});