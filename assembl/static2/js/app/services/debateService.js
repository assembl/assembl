import HttpRequestHandler from '../utils/httpRequestHandler';

class DebateService {
  static fetchDebateData(discussionId) {
    const that = this;
    const fetchUrl = `/api/v1/discussion/${discussionId}`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUrl }).then((debateData) => {
      return that.buildDebateData(debateData);
    });
  }
  static buildDebateData(debateData) {
    return {
      slug: debateData.slug,
      topic: debateData.topic,
      logo: debateData.logo,
      introduction: debateData.introduction,
      objectives: debateData.objectives,
      help_url: debateData.help_url
    };
  }
}

export default DebateService;