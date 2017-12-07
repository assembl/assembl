// @flow
import { UPDATE_CONTENT_LOCALE, UPDATE_CONTENT_LOCALE_BY_ID, UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE } from './actionTypes';
import type {
  ContentLocaleMapping,
  UpdateContentLocale,
  UpdateContentLocaleById,
  UpdateContentLocaleByOriginalLocale
} from './actionTypes';

export const updateContentLocaleById = (id: string, value: string): UpdateContentLocaleById => ({
  type: UPDATE_CONTENT_LOCALE_BY_ID,
  id: id,
  value: value
});

export const updateContentLocaleByOriginalLocale = (
  originalLocale: string,
  value: string
): UpdateContentLocaleByOriginalLocale => ({
  type: UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE,
  originalLocale: originalLocale,
  value: value
});

export const updateContentLocale = (data: ContentLocaleMapping): UpdateContentLocale => ({
  type: UPDATE_CONTENT_LOCALE,
  data: data
});