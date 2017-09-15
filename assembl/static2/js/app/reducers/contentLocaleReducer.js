// @flow
import type ReduxAction from 'redux';

import type { Action } from '../actions/actionTypes';

export default function contentLocale(state: string = 'fr', action: ReduxAction<Action>): string {
  if (action.type === 'SET_CONTENT_LOCALE') {
    return action.value;
  }

  return state;
}