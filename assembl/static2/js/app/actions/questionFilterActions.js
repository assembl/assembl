// @flow

export const SET_QUESTION_POSTS_POLICIES: 'SET_QUESTION_POSTS_POLICIES' = 'SET_QUESTION_POSTS_POLICIES';

export const setQuestionPostsFilterPolicies = (
  postsDisplayPolicy: PostsDisplayPolicy,
  postsOrderPolicy: PostsOrderPolicy,
  postsFiltersStatus: PostsFiltersStatus
) => ({
  type: SET_QUESTION_POSTS_POLICIES,
  postsDisplayPolicy: postsDisplayPolicy,
  postsFiltersStatus: postsFiltersStatus,
  postsOrderPolicy: postsOrderPolicy
});