import { xmlHttpRequest } from '../utils/httpRequestHandler';
import { getSortedArrayByKey } from '../utils/globalFunctions';

export const buildDebateData = (debateData, prefs, timeline) => {
  const socialMedias = prefs.extra_json && prefs.extra_json.socialMedias ? prefs.extra_json.socialMedias : null;
  const headerBackgroundUrl = prefs.extra_json && prefs.extra_json.headerBackgroundUrl ? prefs.extra_json.headerBackgroundUrl : null;
  const objectivesBackground = prefs.extra_json && prefs.extra_json.objectivesBackground ? prefs.extra_json.objectivesBackground : null;
  const twitter = prefs.extra_json && prefs.extra_json.twitter ? prefs.extra_json.twitter : null;
  const sortedTimeline = timeline.length > 0 ? getSortedArrayByKey(timeline, 'start') : null;
  const startDate = timeline.length > 0 ? sortedTimeline[0].start : null;
  const endDate = timeline.length > 0 ? sortedTimeline[timeline.length - 1].end : null;
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
    timeline: sortedTimeline,
    helpUrl: debateData.help_url,
    videoUrl: prefs.video_url,
    termsOfUseUrl: prefs.terms_of_use_url,
    videoDescription: prefs.video_description,
    socialMedias: socialMedias,
    twitter: twitter
  };
};

export const getDebateData = (debateId) => {
  const url1 = `/data/Discussion/${debateId}`;
  const url2 = `/data/Discussion/${debateId}/preferences`;
  const url3 = `/data/Discussion/${debateId}/timeline_events/`;
  const request1 = xmlHttpRequest({ method: 'GET', url: url1 });
  const request2 = xmlHttpRequest({ method: 'GET', url: url2 });
  const request3 = xmlHttpRequest({ method: 'GET', url: url3 });
  return Promise.all([request1, request2, request3]).then((results) => {
    const data = results[0];
    const prefs = results[1];
    const timeline = results[2];
    return buildDebateData(data, prefs[0], timeline);
  });
};