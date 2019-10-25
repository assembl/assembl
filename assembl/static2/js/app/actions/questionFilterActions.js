// @flow

export const SET_QUESTION_POSTS_POLICIES: 'SET_QUESTION_POSTS_POLICIES' = 'SET_QUESTION_POSTS_POLICIES';
export const ADD_QUESTION_HASHTAG_FILTER: 'ADD_QUESTION_HASHTAG_FILTER' = 'ADD_QUESTION_HASHTAG_FILTER';
export const SET_QUESTION_HASHTAGS_FILTER: 'SET_QUESTION_HASHTAGS_FILTER' = 'SET_QUESTION_HASHTAGS_FILTER';

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

export const addQuestionPostsFilterHashtags = (hashtag: string) => ({
  type: ADD_QUESTION_HASHTAG_FILTER,
  hashtag: hashtag
});

export const setQuestionPostsFilterHashtags = (hashtags: string[]) => ({
  type: SET_QUESTION_HASHTAGS_FILTER,
  hashtags: hashtags
});