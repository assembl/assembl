import HttpRequestHandler from '../utils/httpRequestHandler';

class DebateService {
  static fetchDebateData(debateId) {
    const fetchUrl = `/api/v1/discussion/${debateId}`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUrl }).then((debateData) => {
      return debateData;
    });
  }
}

export default DebateService;