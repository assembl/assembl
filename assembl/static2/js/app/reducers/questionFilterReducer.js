// @flow
import { defaultDisplayPolicy, defaultOrderPolicy } from '../components/debate/common/postsFilter/policies';
import {
  ADD_QUESTION_HASHTAG_FILTER,
  SET_QUESTION_HASHTAGS_FILTER,
  SET_QUESTION_POSTS_POLICIES
} from '../actions/questionFilterActions';

const initialState: PostsFilterState = {
  postsDisplayPolicy: defaultDisplayPolicy,
  postsFiltersStatus: {
    myPostsAndAnswers: false,
    onlyMyPosts: false,
    hashtags: []
  },
  postsOrderPolicy: defaultOrderPolicy
};

const QuestionFilterReducer = (state: PostsFilterState = initialState, action: any): PostsFilterState => {
  switch (action.type) {
  case SET_QUESTION_POSTS_POLICIES:
    return {
      ...state,
      postsDisplayPolicy: action.postsDisplayPolicy,
      postsOrderPolicy: action.postsOrderPolicy,
      postsFiltersStatus: { ...state.postsFiltersStatus, ...action.postsFiltersStatus }
    };
  case ADD_QUESTION_HASHTAG_FILTER:
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
  case SET_QUESTION_HASHTAGS_FILTER:
    return {
      ...state,
      postsFiltersStatus: {
        ...state.postsFiltersStatus,
        hashtags: action.hashtags
      }
    };
  default:
    return state;
  }
};

export default QuestionFilterReducer;