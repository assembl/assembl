import { combineReducers } from 'redux';
import { i18nReducer } from 'react-redux-i18n';
import Debate from './debateReducer';

export default combineReducers({
  i18n: i18nReducer,
  debate: Debate
});