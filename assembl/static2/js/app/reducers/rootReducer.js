import { combineReducers } from 'redux';
import { i18nReducer } from 'react-redux-i18n';
import Debate from './debateReducer';
import Posts from './postsReducer';
import Users from './usersReducer';

export default combineReducers({
  i18n: i18nReducer,
  debate: Debate,
  posts: Posts,
  users: Users
});