// @flow
import type ReduxAction from 'redux';
import { Map } from 'immutable';

import type { Action } from '../actions/actionTypes';
import { SET_CONTENT_LOCALE } from '../actions/actionTypes';

export default function contentLocale(state: Map = Map(), action: ReduxAction<Action>): Map {
  if (action.type === SET_CONTENT_LOCALE) {
    return state.set(action.originalLocale, action.value);
  }

  return state;
}