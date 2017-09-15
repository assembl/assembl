// @flow
import { SET_CONTENT_LOCALE } from './actionTypes';
import type { SetContentLocale } from './actionTypes';

export const setContentLocale = (value: string): SetContentLocale => {
  return {
    type: SET_CONTENT_LOCALE,
    value: value
  };
};