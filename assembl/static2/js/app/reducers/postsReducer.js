const PostReducer = (state = {}, action) => {
  switch (action.type) {
  case 'FETCH_POSTS':
    return { posts: null, postsLoading: true, postsError: null };
  case 'RESOLVED_FETCH_POSTS':
    return { posts: action.posts, postsLoading: false, postsError: null };
  case 'FAILED_FETCH_POSTS':
    return { posts: null, postsLoading: false, postsError: action.postsError };
  default:
    return state;
  }
};

export default PostReducer;