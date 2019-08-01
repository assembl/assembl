// @flow
import { combineReducers } from 'redux';
import { i18nReducer } from 'react-redux-i18n';
import Context from './contextReducer';
import Debate from './debateReducer';
import Partners from './partnersReducer';
import Synthesis from './synthesisReducer';
import Auth from './authenticationReducer';
import Timeline from './timelineReducers';
import Admin from './adminReducer';
import Tags from './tagReducer';
import contentLocale, { defaultContentLocaleMapping } from './contentLocaleReducer';
import ThreadFilter from './threadFilterReducer';
import * as screenDimensions from './screenDimensionsReducers';

const reducers = {
  admin: Admin,
  auth: Auth,
  contentLocale: contentLocale,
  context: Context,
  debate: Debate,
  defaultContentLocaleMapping: defaultContentLocaleMapping,
  i18n: i18nReducer,
  partners: Partners,
  synthesis: Synthesis,
  tags: Tags,
  timeline: Timeline,
  threadFilter: ThreadFilter,
  ...screenDimensions
};

export type Reducers = typeof reducers;

type $ExtractFunctionReturn = <V>(v: (...args: any) => V) => V;

export type State = $ObjMap<Reducers, $ExtractFunctionReturn>;

export default combineReducers(reducers);