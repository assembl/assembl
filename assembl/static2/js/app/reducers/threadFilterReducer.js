// @flow
import { ADD_THREAD_HASHTAG_FILTER, SET_THREAD_POSTS_POLICIES } from '../actions/threadFilterActions';
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
  case ADD_THREAD_HASHTAG_FILTER:
    if (state.postsFiltersStatus.hashtags.indexOf(action.hashtag) === -1) {
      return {
        ...state,
        postsFiltersStatus: {
          ...state.postsFiltersStatus,
          hashtags: [action.hashtag, ...state.postsFiltersStatus.hashtags]
        }
      };
    }
    return state;
  default:
    return state;
  }
};

export default ThreadFilterReducer;