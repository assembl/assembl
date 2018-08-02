// @flow
import { I18n } from 'react-redux-i18n';

import type { I18nValue, FileValue, FileVariable, MutationsPromises, SaveStatus } from './types.flow';
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

export function convertEntries(_entries: LangstringEntries): I18nValue {
  const entries = _entries || [];
  return entries.reduce((result, item) => {
    const { localeCode, value } = item;
    return {
      ...result,
      [localeCode]: value
    };
  }, {});
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

export function getFileVariable(img: FileValue, initialImg: FileValue): FileVariable {
  if (initialImg && !img) {
    return 'TO_DELETE';
  }

  // If thematic.img.externalUrl is an object, it means it's a File.
  // We need to send image: null if we didn't change the image.
  const variab = img && typeof img.externalUrl === 'object' ? img.externalUrl : null;
  return variab;
}