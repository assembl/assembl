import HttpRequestHandler from '../utils/httpRequestHandler';

class PostService {
  static fetchPosts(debateId) {
    const fetchPostsUrl = `/api/v1/discussion/${debateId}/posts`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchPostsUrl }).then((posts) => {
      return posts;
    });
  }
}

export default PostService;