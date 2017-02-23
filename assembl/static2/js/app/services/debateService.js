import HttpRequestHandler from '../utils/httpRequestHandler';

class DebateService {
  static fetchDebateData(debateId) {
    const fetchUrl = `/data/Discussion/${debateId}`;
    return HttpRequestHandler.request({ method: 'GET', url: fetchUrl }).then((debateData) => {
      let config;
      try {
        config = require(`../config/${debateData.slug}`);// eslint-disable-line
      } catch (e) {
        config = require('../config/default');// eslint-disable-line
      }
      return {
        help_url: debateData.help_url,
        introduction: debateData.introduction,
        logo: debateData.logo,
        objectives: debateData.objectives,
        slug: debateData.slug,
        topic: debateData.topic,
        config: config.default
      };
    });
  }
}

export default DebateService;