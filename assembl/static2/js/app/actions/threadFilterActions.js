// @flow

export const THREAD_POSTS_MUST_BE_REFRESHED: 'THREAD_POSTS_MUST_BE_REFRESHED' = 'THREAD_POSTS_MUST_BE_REFRESHED';
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

export const postsMustBeRefreshed = (mustBeRefreshed: boolean) => ({
  type: THREAD_POSTS_MUST_BE_REFRESHED,
  postsMustBeRefreshed: mustBeRefreshed
});