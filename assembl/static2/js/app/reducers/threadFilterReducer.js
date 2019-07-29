// @flow
import { SET_THREAD_POSTS_POLICIES, THREAD_POSTS_MUST_BE_REFRESHED } from '../actions/threadFilterActions';
import { defaultDisplayPolicy, defaultOrderPolicy } from '../components/debate/common/postsFilter/policies';

type ThreadFilterState = {
  postsDisplayPolicy: PostsDisplayPolicy,
  postsFiltersStatus: PostsFiltersStatus,
  postsOrderPolicy: PostsOrderPolicy,
  postsMustBeRefreshed: boolean
};

const initialState: ThreadFilterState = {
  postsDisplayPolicy: defaultDisplayPolicy,
  postsFiltersStatus: {
    myPostsAndAnswers: false,
    onlyMyPosts: false
  },
  postsOrderPolicy: defaultOrderPolicy,
  postsMustBeRefreshed: false
};

const ThreadFilterReducer = (state: ThreadFilterState = {}, action: any): ThreadFilterState => {
  const newState = { ...state };
  switch (action.type) {
  case '@@redux/INIT':
    // initial state
    return { ...initialState };
  case SET_THREAD_POSTS_POLICIES:
    newState.postsDisplayPolicy = action.postsDisplayPolicy;
    newState.postsOrderPolicy = action.postsOrderPolicy;
    newState.postsFiltersStatus = { ...action.postsFiltersStatus };
    newState.postsMustBeRefreshed = true;
    return newState;
  case THREAD_POSTS_MUST_BE_REFRESHED:
    newState.postsMustBeRefreshed = !!action.postsMustBeRefreshed;
    return newState;
  default:
    return state;
  }
};

export default ThreadFilterReducer;