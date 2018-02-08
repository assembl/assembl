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
import contentLocale, { defaultContentLocaleMapping } from './contentLocaleReducer';
import * as screenDimensions from './screenDimensionsReducers';

const reducers = {
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

export type Reducers = typeof reducers;

type $ExtractFunctionReturn = <V>(v: (...args: any) => V) => V;

export type State = $ObjMap<Reducers, $ExtractFunctionReturn>;

export default combineReducers(reducers);