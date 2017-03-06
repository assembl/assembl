import { getPosts } from '../services/postsService';

const loadingPosts = () => {
  return {
    type: 'FETCH_POSTS',
    posts: null
  };
};

const resolvedFetchPosts = (posts) => {
  return {
    type: 'RESOLVED_FETCH_POSTS',
    posts: posts
  };
};

const failedFetchPosts = (error) => {
  return {
    type: 'FAILED_FETCH_POSTS',
    postsError: error
  };
};

export const fetchPosts = (debateId) => {
  return function (dispatch) {
    dispatch(loadingPosts());
    return getPosts(debateId).then((posts) => {
      dispatch(resolvedFetchPosts(posts));
    }).catch((error) => {
      dispatch(failedFetchPosts(error));
    });
  };
};