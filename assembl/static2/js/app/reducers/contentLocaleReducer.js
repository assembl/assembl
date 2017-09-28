// @flow
import type ReduxAction from 'redux';
import { fromJS, Map } from 'immutable';

import type { Action } from '../actions/actionTypes';
import {
  UPDATE_CONTENT_LOCALE,
  UPDATE_CONTENT_LOCALE_BY_ID,
  UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE
} from '../actions/actionTypes';

export default function contentLocale(state: Map = Map(), action: ReduxAction<Action>): Map {
  switch (action.type) {
  case UPDATE_CONTENT_LOCALE:
    return state.merge(fromJS(action.data));
  case UPDATE_CONTENT_LOCALE_BY_ID:
    return state.setIn([action.id, 'contentLocale'], action.value);
  case UPDATE_CONTENT_LOCALE_BY_ORIGINAL_LOCALE:
    return state.map((info) => {
      if (info.get('originalLocale') === action.originalLocale) {
        return info.set('contentLocale', action.value);
      }

      return info;
    });
  default:
    return state;
  }
}