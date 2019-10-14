// @flow
import { defaultDisplayPolicy, defaultOrderPolicy } from '../components/debate/common/postsFilter/policies';
import { SET_QUESTION_POSTS_POLICIES } from '../actions/questionFilterActions';

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
      postsFiltersStatus: { ...action.postsFiltersStatus }
    };
  default:
    return state;
  }
};

export default QuestionFilterReducer;