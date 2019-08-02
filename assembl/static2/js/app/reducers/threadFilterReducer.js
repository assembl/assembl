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

const ThreadFilterReducer = (state: ThreadFilterState = initialState, action: any): ThreadFilterState => {
  switch (action.type) {
  case SET_THREAD_POSTS_POLICIES:
    return {
      ...state,
      postsDisplayPolicy: action.postsDisplayPolicy,
      postsOrderPolicy: action.postsOrderPolicy,
      postsFiltersStatus: { ...action.postsFiltersStatus },
      postsMustBeRefreshed: true
    };
  case THREAD_POSTS_MUST_BE_REFRESHED:
    return {
      ...state,
      postsMustBeRefreshed: !!action.postsMustBeRefreshed
    };
  default:
    return state;
  }
};

export default ThreadFilterReducer;