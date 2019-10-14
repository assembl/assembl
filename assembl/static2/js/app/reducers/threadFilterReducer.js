// @flow
import { SET_THREAD_POSTS_POLICIES } from '../actions/threadFilterActions';
import { defaultDisplayPolicy, defaultOrderPolicy } from '../components/debate/common/postsFilter/policies';

const initialState: PostsFilterState = {
  postsDisplayPolicy: defaultDisplayPolicy,
  postsFiltersStatus: {
    myPostsAndAnswers: false,
    onlyMyPosts: false,
    hashtags: []
  },
  postsOrderPolicy: defaultOrderPolicy
};

const ThreadFilterReducer = (state: PostsFilterState = initialState, action: any): PostsFilterState => {
  switch (action.type) {
  case SET_THREAD_POSTS_POLICIES:
    return {
      ...state,
      postsDisplayPolicy: action.postsDisplayPolicy,
      postsOrderPolicy: action.postsOrderPolicy,
      postsFiltersStatus: { ...action.postsFiltersStatus }
    };
  default:
    return state;
  }
};

export default ThreadFilterReducer;