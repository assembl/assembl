// @flow
import { EditorState } from 'draft-js';
import moment from 'moment';

/* eslint-disable import/no-extraneous-dependencies */
import TestEditorUtils from 'assembl-test-editor-utils';
/* eslint-enable import/no-extraneous-dependencies */

import { createEditorStateFromText } from '../../../helpers/draftjs';
import { client, docFile, imgFile } from '../../../helpers/graphql';
import * as utils from '../../../../js/app/components/form/utils';
import { displayAlert } from '../../../../js/app/utils/utilityManager';
import { ICO_DOC } from '../../../../js/app/constants';

jest.mock('../../../../js/app/utils/utilityManager');

const { createEditorStateWithTwoAttachments } = TestEditorUtils;

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

describe('convertRichTextToVariables function', () => {
  const { convertRichTextToVariables } = utils;
  it('should convert a rich text i18n value in langstring entries', async () => {
    const input = {
      en: createEditorStateFromText('Hello'),
      fr: createEditorStateFromText('Bonjour')
    };
    const { attachments, entries } = await convertRichTextToVariables(input, client);

    expect(attachments).toEqual([]);

    const expectedEntries = [
      {
        localeCode: 'en',
        value: '<p>Hello</p>'
      },
      {
        localeCode: 'fr',
        value: '<p>Bonjour</p>'
      }
    ];
    expect(entries).toEqual(expectedEntries);
  });

  it('should upload documents before to convert to langstring entries', async () => {
    const editorStateWithTwoAttachment = createEditorStateWithTwoAttachments(imgFile, docFile, 'My text in english');
    const input = {
      en: editorStateWithTwoAttachment,
      fr: createEditorStateFromText('Mon texte en français')
    };
    const expectedEn =
      // eslint-disable-next-line prefer-template
      '<p></p><div class="atomic-block" data-blocktype="atomic">' +
      '<img class="attachment-image" src="/data/my-img.png" alt="" title="My great image" ' +
      'data-id="1" data-mimetype="image/png" /></div><p></p><div class="atomic-block" ' +
      'data-blocktype="atomic"><a href="/data/my-doc.pdf" title="My great document"><img ' +
      'class="attachment-icon" alt="unknown" src="' +
      ICO_DOC +
      '" data-id="2" data-mimetype="application/pdf" ' +
      'data-title="My great document" data-externalurl="/data/my-doc.pdf" /></a></div><p>My text in english</p>';
    const expectedFr = '<p>Mon texte en français</p>';

    const { attachments, entries } = await convertRichTextToVariables(input, client);

    expect(attachments).toEqual(['1', '2']);

    const expectedEntries = [{ localeCode: 'en', value: expectedEn }, { localeCode: 'fr', value: expectedFr }];
    expect(entries).toEqual(expectedEntries);
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

describe('convertISO8601StringToDateTime function', () => {
  const { convertISO8601StringToDateTime } = utils;
  it('should return a DateTime in UTC timezone from an ISO8601 string input', () => {
    const s = '2019-01-01T00:00:00.000+00:00';
    const expected = { time: moment(s).utc() };
    const actual = convertISO8601StringToDateTime(s);
    expect(actual).toEqual(expected);
  });

  it('should return null time+zone from an empty string input', () => {
    const s = '';
    const expected = { time: null };
    const actual = convertISO8601StringToDateTime(s);
    expect(actual).toEqual(expected);
  });

  it('should return null time+zone from any random string input', () => {
    const s = 'These are not the droids that are you looking for';
    const expected = { time: null };
    const actual = convertISO8601StringToDateTime(s);
    expect(actual).toEqual(expected);
  });
});

describe('convertDateTimeToISO8601String function', () => {
  const { convertDateTimeToISO8601String } = utils;
  it('should return a an ISO8601 string input from a Moment object', () => {
    const s = { time: moment('2019-01-01T00:00:00.000+00:00').utc() };
    const expected = '2019-01-01T00:00:00.000Z';
    const actual = convertDateTimeToISO8601String(s);
    expect(actual).toMatch(expected);
  });

  it('should return null Date from a null input', () => {
    const s = { time: null };
    const expected = null;
    const actual = convertDateTimeToISO8601String(s);
    expect(actual).toEqual(expected);
  });

  it('should return null from a Date object', () => {
    const s = { time: new Date() };
    const expected = null;
    // $FlowFixMe only takes a moment$Moment
    const actual = convertDateTimeToISO8601String(s);
    expect(actual).toEqual(expected);
  });
});

describe('convertCheckboxListValueToVariable function', () => {
  const { convertCheckboxListValueToVariable } = utils;
  it('should convert an array of checkbox values to a array of strings', () => {
    const values = [
      {
        isChecked: false,
        label: 'German',
        value: 'de'
      },
      {
        isChecked: true,
        label: 'English',
        value: 'en'
      },
      {
        isChecked: false,
        label: 'French',
        value: 'fr'
      }
    ];
    const expected = ['en'];
    const actual = convertCheckboxListValueToVariable(values);
    expect(actual).toEqual(expected);
  });
});