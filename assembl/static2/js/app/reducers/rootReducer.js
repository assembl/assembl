import { combineReducers } from 'redux';
import { i18nReducer } from 'react-redux-i18n';
import client from '../client';
import Context from './contextReducer';
import Debate from './debateReducer';
import Posts from './postsReducer';
import Partners from './partnersReducer';
import Synthesis from './synthesisReducer';
import Auth from './authenticationReducer';
import Phase from './phaseReducer';
import Admin from './adminReducer';

export default combineReducers({
  apollo: client.reducer(),
  i18n: i18nReducer,
  context: Context,
  debate: Debate,
  posts: Posts,
  partners: Partners,
  synthesis: Synthesis,
  auth: Auth,
  phase: Phase,
  admin: Admin
});