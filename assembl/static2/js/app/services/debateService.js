import HttpRequestHandler from '../utils/httpRequestHandler';

class DebateService {
  static fetchDebateData(debateId) {
    const that = this;
    const url1 = `/data/Discussion/${debateId}`;
    const url2 = `/data/Discussion/${debateId}/preferences`;
    const request1 = HttpRequestHandler.request({ method: 'GET', url: url1 });
    const request2 = HttpRequestHandler.request({ method: 'GET', url: url2 });
    return Promise.all([request1, request2]).then(function(results) {
      const data = results[0];
      const prefs = results[1];
      return that.buildDebateData(data, prefs[0]);
    });
  }
  static buildDebateData(debateData, prefs) {
    const socialMedias = prefs.extra_json && prefs.extra_json.socialMedias ? prefs.extra_json.socialMedias : null;
    const headerBackgroundUrl = prefs.extra_json && prefs.extra_json.headerBackgroundUrl ? prefs.extra_json.headerBackgroundUrl : null;
    const startDate = prefs.extra_json && prefs.extra_json.startDate ? prefs.extra_json.startDate : null;
    const endDate = prefs.extra_json && prefs.extra_json.endDate ? prefs.extra_json.endDate : null;
    const objectivesBackground = prefs.extra_json && prefs.extra_json.objectivesBackground ? prefs.extra_json.objectivesBackground : null;
    const twitter = prefs.extra_json && prefs.extra_json.twitter ? prefs.extra_json.twitter : null;
    const timeline = prefs.extra_json && prefs.extra_json.timeline ? prefs.extra_json.timeline : null;
    return {
      slug: debateData.slug,
      logo: debateData.logo,
      topic: debateData.topic,
      startDate: startDate,
      endDate: endDate,
      introduction: debateData.introduction,
      objectives: debateData.objectives,
      objectivesBackground: objectivesBackground,
      headerBackgroundUrl: headerBackgroundUrl,
      timeline: timeline,
      helpUrl: debateData.help_url,
      videoUrl: prefs.video_url,
      videoDescription: prefs.video_description,
      socialMedias: socialMedias,
      twitter: twitter
    };
  }
}

export default DebateService;