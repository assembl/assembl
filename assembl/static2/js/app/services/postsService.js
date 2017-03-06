import { xmlHttpRequest } from '../utils/httpRequestHandler';

export const getPosts = (debateId) => {
  const fetchPostsUrl = `/api/v1/discussion/${debateId}/posts`;
  return xmlHttpRequest({ method: 'GET', url: fetchPostsUrl }).then((posts) => {
    return posts;
  });
};