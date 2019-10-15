// @flow

export const SET_THREAD_POSTS_POLICIES: 'SET_THREAD_POSTS_POLICIES' = 'SET_THREAD_POSTS_POLICIES';
export const ADD_THREAD_HASHTAG_FILTER: 'ADD_THREAD_HASHTAG_FILTER' = 'ADD_THREAD_HASHTAG_FILTER';

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

export const addPostsFilterHashtag = (hashtag: string) => ({
  type: ADD_THREAD_HASHTAG_FILTER,
  hashtag: hashtag
});