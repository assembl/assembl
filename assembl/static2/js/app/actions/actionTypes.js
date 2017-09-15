/* redux action types */
// @flow
export const SET_CONTENT_LOCALE: 'SET_CONTENT_LOCALE' = 'SET_CONTENT_LOCALE';

export type SetContentLocale = {
  type: typeof SET_CONTENT_LOCALE,
  value: string
};

type BasicAction = {
  type: string
};

// TODO: create type for all possible action types

export type Action = SetContentLocale | BasicAction;