import { combineReducers } from 'redux';
import { i18nReducer } from 'react-redux-i18n';
import Context from './contextReducer';
import Debate from './debateReducer';
import Partners from './partnersReducer';
import Synthesis from './synthesisReducer';
import Auth from './authenticationReducer';
import Phase from './phaseReducer';
import Admin from './adminReducer';
import contentLocale from './contentLocaleReducer';

export default combineReducers({
  i18n: i18nReducer,
  contentLocale: contentLocale,
  context: Context,
  debate: Debate,
  partners: Partners,
  synthesis: Synthesis,
  auth: Auth,
  phase: Phase,
  admin: Admin
});

// TODO use a proper key in redux store and create redux actions to set it
export const getContentLocale = (state) => {
  return state.i18n.locale;
};