// @flow
import {
  RESET_THREAD_FILTER_DEFAULTS,
  SET_THREAD_POSTS_DISPLAY_MODE,
  SET_THREAD_POSTS_ORDER,
  THREAD_POSTS_MUST_BE_REFRESHED
} from '../actions/threadFilterActions';
import { defaultDisplayPolicy, defaultOrderPolicy } from '../components/debate/common/postsFilter/policies';

type ThreadFilterState = {
  postsDisplayPolicy: PostsDisplayPolicy,
  postsOrderPolicy: PostsOrderPolicy,
  postsMustBeRefreshed: boolean
};

const initialState = {
  postsDisplayPolicy: defaultDisplayPolicy,
  postsOrderPolicy: defaultOrderPolicy,
  postsMustBeRefreshed: false
};

const ThreadFilterReducer = (state: ThreadFilterState = {}, action: any): ThreadFilterState => {
  const newState = { ...state };
  switch (action.type) {
  case '@@redux/INIT':
    // initial state
    return { ...initialState };
  case RESET_THREAD_FILTER_DEFAULTS:
    // reset default state
    return { ...initialState, postsMustBeRefreshed: true };
  case SET_THREAD_POSTS_ORDER:
    newState.postsMustBeRefreshed = true;
    newState.postsOrderPolicy = action.postsOrderPolicy;
    return newState;
  case SET_THREAD_POSTS_DISPLAY_MODE:
    newState.postsMustBeRefreshed = true;
    newState.postsDisplayPolicy = action.postsDisplayPolicy;
    return newState;
  case THREAD_POSTS_MUST_BE_REFRESHED:
    newState.postsMustBeRefreshed = !!action.postsMustBeRefreshed;
    return newState;
  default:
    return state;
  }
};

export default ThreadFilterReducer;