import HttpRequestHandler from '../utils/httpRequestHandler';

class PostService {
  static fetchPosts(discussionId) {
    const fetchPostsUrl = `discussion/${discussionId}/posts`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchPostsUrl }).then((posts) => {
      return posts;
    });
  }
}

export default PostService;