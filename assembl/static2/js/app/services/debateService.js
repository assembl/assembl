import HttpRequestHandler from '../utils/httpRequestHandler';

class DebateService {
  static fetchDebateData(discussionId) {
    const fetchUrl = `discussion/${discussionId}`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUrl }).then((debateData) => {
      return debateData;
    });
  }
}

export default DebateService;