// @flow
import { combineReducers } from 'redux';
import { i18nReducer } from 'react-redux-i18n';
import Context from './contextReducer';
import Debate from './debateReducer';
import Partners from './partnersReducer';
import Synthesis from './synthesisReducer';
import Auth from './authenticationReducer';
import Phase from './phaseReducer';
import Admin from './adminReducer';
import type { AdminReducer } from './adminReducer';
import contentLocale, { defaultContentLocaleMapping } from './contentLocaleReducer';
import * as screenDimensions from './screenDimensionsReducers';

export type RootReducer = {
  i18n: Object,
  contentLocale: Object,
  defaultContentLocaleMapping: Object,
  context: Object,
  debate: Object,
  partners: Object,
  synthesis: Object,
  auth: Object,
  phase: Object,
  admin: AdminReducer,
  screenDimensions: Object // TODO: screenDimensions type
};

const reducers: RootReducer = {
  i18n: i18nReducer,
  contentLocale: contentLocale,
  defaultContentLocaleMapping: defaultContentLocaleMapping,
  context: Context,
  debate: Debate,
  partners: Partners,
  synthesis: Synthesis,
  auth: Auth,
  phase: Phase,
  admin: Admin,
  ...screenDimensions
};

export default combineReducers(reducers);