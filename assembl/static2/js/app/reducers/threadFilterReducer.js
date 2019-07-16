// @flow
import {
  RESET_THREAD_FILTER_DEFAULTS,
  SET_THREAD_POSTS_ORDER,
  THREAD_POSTS_MUST_BE_REFRESHED
} from '../actions/threadFilterActions';
import { defaultOrderPolicy } from '../components/debate/common/postsFilter/menu';

type ThreadFilterState = {
  postsOrderPolicy: PostsOrderPolicy,
  postsMustBeRefreshed: boolean
};

const ThreadFilterReducer = (state: ThreadFilterState = {}, action: any) => {
  const newState = { ...state };
  switch (action.type) {
  case '@@redux/INIT':
    return {
      postsOrderPolicy: defaultOrderPolicy,
      postsMustBeRefreshed: false
    };
  case RESET_THREAD_FILTER_DEFAULTS:
    return {
      postsOrderPolicy: defaultOrderPolicy,
      postsMustBeRefreshed: true
    };
  case SET_THREAD_POSTS_ORDER:
    newState.postsMustBeRefreshed = true;
    newState.postsOrderPolicy = action.postsOrderPolicy;
    return newState;
  case THREAD_POSTS_MUST_BE_REFRESHED:
    newState.postsMustBeRefreshed = !!action.postsMustBeRefreshed;
    return newState;
  default:
    return state;
  }
};

export default ThreadFilterReducer;