// @flow

export const SET_THREAD_POSTS_POLICIES: 'SET_THREAD_POSTS_POLICIES' = 'SET_THREAD_POSTS_POLICIES';

export const setThreadPostsFilterPolicies = (
  postsDisplayPolicy: PostsDisplayPolicy,
  postsOrderPolicy: PostsOrderPolicy,
  postsFiltersStatus: PostsFiltersStatus
) => ({
  type: SET_THREAD_POSTS_POLICIES,
  postsDisplayPolicy: postsDisplayPolicy,
  postsFiltersStatus: postsFiltersStatus,
  postsOrderPolicy: postsOrderPolicy
});