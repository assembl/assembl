// @flow
import { type I18nValue } from './types.flow';

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