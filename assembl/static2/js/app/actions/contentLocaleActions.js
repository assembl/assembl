// @flow
import { SET_CONTENT_LOCALE } from './actionTypes';
import type { SetContentLocale } from './actionTypes';

export const setContentLocale = (originalLocale: string, value: string): SetContentLocale => {
  return {
    type: SET_CONTENT_LOCALE,
    originalLocale: originalLocale,
    value: value
  };
};