// @flow
import { I18n } from 'react-redux-i18n';
import countBy from 'lodash/countBy';
import get from 'lodash/get';

import type { I18nValue, FileValue, FileVariable, MutationsPromises, I18nRichTextValue, SaveStatus } from './types.flow';
import type LandingPageModule from '../administration/landingPage/manageModules';
import { convertEditorStateToHTML, convertEntriesToEditorState } from '../../utils/draftjs';
import { displayAlert } from '../../utils/utilityManager';
import { runSerial } from '../administration/saveButton';

export function i18nValueIsEmpty(v: I18nValue): boolean {
  return (
    !v ||
    Object.keys(v)
      .map(key => v[key]) // flow doesn't treat Object.values as expected, see: https://github.com/facebook/flow/issues/2221
      .every(s => s.length === 0)
  );
}

export function richTextI18nValueIsEmpty(v: I18nRichTextValue): boolean {
  return (
    !v ||
    Object.keys(v)
      .map(key => v[key]) // flow doesn't treat Object.values as expected, see: https://github.com/facebook/flow/issues/2221
      .every(es => !es || !es.getCurrentContent().hasText())
  );
}

// [{ localeCode: 'fr', value: 'foo' }] => { fr: 'foo' }
export function convertEntriesToI18nValue<T>(
  _entries: Array<{
    localeCode: string,
    value: T
  }>
): { [string]: T } {
  const entries = _entries || [];
  return entries.reduce((result, item) => {
    const { localeCode, value } = item;
    return {
      ...result,
      [localeCode]: value
    };
  }, {});
}

export function convertEntriesToI18nRichText(entries: RichTextLangstringEntries): I18nRichTextValue {
  return convertEntriesToI18nValue(convertEntriesToEditorState(entries));
}

export function getValidationState(error: ?string, touched: ?boolean): ?string {
  return touched && error ? 'error' : null;
}

export const createSave = (successMsgId: string) => async (mutationsPromises: MutationsPromises): Promise<SaveStatus> => {
  let status = 'PENDING';
  await runSerial(mutationsPromises)
    .then(() => {
      status = 'OK';
      displayAlert('success', I18n.t(successMsgId));
    })
    .catch((error) => {
      status = 'KO';
      displayAlert('danger', error.message, false, 30000);
    });

  return status;
};

export function convertToEntries(valuesByLocale: I18nValue): LangstringEntries {
  return Object.keys(valuesByLocale).map(locale => ({
    localeCode: locale,
    value: valuesByLocale[locale]
  }));
}

export function convertRichTextToEntries(valuesByLocale: I18nRichTextValue): LangstringEntries {
  return Object.keys(valuesByLocale).map(locale => ({
    localeCode: locale,
    value: convertEditorStateToHTML(valuesByLocale[locale])
  }));
}

export function getFileVariable(img: FileValue, initialImg: ?FileValue): FileVariable {
  if (initialImg && !img) {
    return 'TO_DELETE';
  }

  // If thematic.img.externalUrl is a File,
  // we need to send image: null if we didn't change the image.
  const variab = img && img.externalUrl instanceof File ? img.externalUrl : null;
  return variab;
}

export const addEnumSuffixToModuleTitles = (modules: Array<LandingPageModule>): Array<LandingPageModule> => {
  // Add a suffix to the title of the module if this module appears more than one time.
  // This suffix is the number of times this module appeared in the array.
  const moduleTypeTitles = modules.map(module => ({ title: module.moduleType.title }));
  const titleCounts = countBy(moduleTypeTitles, 'title');
  const duplicatesCurrentIndex = {};
  return modules.map((module) => {
    const { title } = module.moduleType;
    if (title && titleCounts[title] > 1) {
      duplicatesCurrentIndex[title] = get(duplicatesCurrentIndex, title, 0) + 1;
      return { ...module, moduleType: { ...module.moduleType, title: title && `${title} ${duplicatesCurrentIndex[title]}` } };
    }
    return module;
  });
};