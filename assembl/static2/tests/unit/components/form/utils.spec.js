// @flow
import { EditorState } from 'draft-js';

import { createEditorStateFromText } from '../../../helpers/draftjs';
import * as utils from '../../../../js/app/components/form/utils';
import { displayAlert } from '../../../../js/app/utils/utilityManager';

jest.mock('../../../../js/app/utils/utilityManager');

describe('i18nValueIsEmpty function', () => {
  const { i18nValueIsEmpty } = utils;
  it('should return true is value is empty', () => {
    const value = {
      en: '',
      fr: ''
    };
    const actual = i18nValueIsEmpty(value);
    expect(actual).toBeTruthy();
  });

  it('should return false is value is not empty', () => {
    const value = {
      en: 'hello',
      fr: 'bonjour'
    };
    const actual = i18nValueIsEmpty(value);
    expect(actual).toBeFalsy();
  });
});

describe('richTextI18nValueIsEmpty function', () => {
  const { richTextI18nValueIsEmpty } = utils;
  it('should return true if value contains only empty editor states', () => {
    const value = {
      en: EditorState.createEmpty(),
      fr: createEditorStateFromText('')
    };
    const actual = richTextI18nValueIsEmpty(value);
    expect(actual).toBeTruthy();
  });

  it('should return true if value contains no entry', () => {
    const value = {};
    const actual = richTextI18nValueIsEmpty(value);
    expect(actual).toBeTruthy();
  });

  it('should return false if value is not empty', () => {
    const value = {
      en: EditorState.createEmpty(),
      fr: createEditorStateFromText('Bonjour')
    };
    const actual = richTextI18nValueIsEmpty(value);
    expect(actual).toBeFalsy();
  });
});

describe('convertEntriesToI18nValue function', () => {
  const { convertEntriesToI18nValue } = utils;
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
    expect(convertEntriesToI18nValue(input)).toEqual(expected);
  });
});

describe('convertEntriesToI18nRichText function', () => {
  const { convertEntriesToI18nRichText } = utils;
  it('should convert langstring entries to an i18n value for forms', () => {
    const input = [
      { localeCode: 'en', value: '<p>Hello</p>' },
      { localeCode: 'es', value: '<p>Hola</p>' },
      { localeCode: 'fr', value: '<p>Salut</p>' }
    ];
    const actual = convertEntriesToI18nRichText(input);
    expect(actual.en.getCurrentContent().getPlainText()).toEqual('Hello');
    expect(actual.fr.getCurrentContent().getPlainText()).toEqual('Salut');
    expect(actual.es.getCurrentContent().getPlainText()).toEqual('Hola');
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

describe('convertRichTextToEntries function', () => {
  const { convertRichTextToEntries } = utils;
  it('should convert a rich text i18n value in langstring entries', () => {
    const input = {
      en: createEditorStateFromText('Hello'),
      fr: createEditorStateFromText('Bonjour')
    };
    const actual = convertRichTextToEntries(input);
    const expected = [{ localeCode: 'en', value: '<p>Hello</p>' }, { localeCode: 'fr', value: '<p>Bonjour</p>' }];
    expect(actual).toEqual(expected);
  });
});

describe('getFileVariable function', () => {
  const { getFileVariable } = utils;
  it('should return a file variable from a file value', () => {
    const file: File = new File([''], 'foo.jpg', { type: 'image/jpeg' });
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
    const file: File = new File([''], 'foo.jpg', { type: 'image/jpeg' });
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