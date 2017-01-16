import HttpRequestHandler from '../utils/httpRequestHandler';

class DebateService {
  static fetchDebateData(debateId) {
    const fetchUrl = `discussion/${debateId}`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUrl }).then((response) => {
      return response;
    });
  }
}

export default DebateService;