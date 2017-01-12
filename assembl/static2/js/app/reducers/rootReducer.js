import { combineReducers } from 'redux';
import { i18nReducer } from 'react-redux-i18n';
import app from './appReducer';

export default combineReducers({
  i18n: i18nReducer,
  app
});