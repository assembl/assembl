import HttpRequestHandler from '../utils/httpRequestHandler';

class DebateService {
  static fetchDebateData(debateId) {
    const that = this;
    const url1 = `/data/Discussion/${debateId}`;
    const url2 = `/data/Discussion/${debateId}/preferences`;
    const request1 = HttpRequestHandler.request({ method: 'GET', url: url1 });
    const request2 = HttpRequestHandler.request({ method: 'GET', url: url2 });
    return Promise.all([request1, request2]).then(function(results) {
      let config;
      try {
        config = require(`../config/${debateData.slug}`);// eslint-disable-line
      } catch (e) {
        config = require('../config/default');// eslint-disable-line
      }
      const data = results[0];
      const prefs = results[1];
      return that.buildDebateData(data, config, prefs[0]);
    });
  }
  static buildDebateData(debateData, config, prefs) {
    return {
      help_url: debateData.help_url,
      introduction: debateData.introduction,
      logo: debateData.logo,
      objectives: debateData.objectives,
      slug: debateData.slug,
      topic: debateData.topic,
      prefs: prefs,
      config: config.default
    };
  }
}

export default DebateService;