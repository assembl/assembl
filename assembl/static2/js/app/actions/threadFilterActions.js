// @flow
export const SET_THREAD_POSTS_ORDER: 'SET_THREAD_POSTS_ORDER' = 'SET_THREAD_POSTS_ORDER';
export const THREAD_POSTS_MUST_BE_REFRESHED: 'THREAD_POSTS_MUST_BE_REFRESHED' = 'THREAD_POSTS_MUST_BE_REFRESHED';

export const setThreadPostsOrder = (postsOrderPolicy: PostsOrderPolicy) => ({
  type: SET_THREAD_POSTS_ORDER,
  postsOrderPolicy: postsOrderPolicy
});

export const postsMustBeRefreshed = (mustBeRefreshed: boolean) => ({
  type: THREAD_POSTS_MUST_BE_REFRESHED,
  postsMustBeRefreshed: mustBeRefreshed
});