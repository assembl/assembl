import { xmlHttpRequest } from '../utils/httpRequestHandler';
import { getSortedArrayByKey } from '../utils/globalFunctions';

export const buildDebateData = (debateData, prefs, timeline, socialShare) => {
  const headerBackgroundUrl =
    prefs.extra_json && prefs.extra_json.headerBackgroundUrl ? prefs.extra_json.headerBackgroundUrl : null;
  const headerLogoUrl = prefs.extra_json && prefs.extra_json.headerLogoUrl ? prefs.extra_json.headerLogoUrl : null;
  const topic = prefs.extra_json && prefs.extra_json.topic ? prefs.extra_json.topic : null;
  const introduction = prefs.extra_json && prefs.extra_json.introduction ? prefs.extra_json.introduction : null;
  const dates = prefs.extra_json && prefs.extra_json.dates ? prefs.extra_json.dates : null;
  const objectives = prefs.extra_json && prefs.extra_json.objectives ? prefs.extra_json.objectives : null;
  const video = prefs.extra_json && prefs.extra_json.video ? prefs.extra_json.video : null;
  const twitter = prefs.extra_json && prefs.extra_json.twitter ? prefs.extra_json.twitter : null;
  const chatbot = prefs.extra_json && prefs.extra_json.chatbot ? prefs.extra_json.chatbot : null;
  const partners = prefs.extra_json && prefs.extra_json.partners ? prefs.extra_json.partners : null;
  const socialMedias = prefs.extra_json && prefs.extra_json.socialMedias ? prefs.extra_json.socialMedias : null;
  const sortedTimeline = timeline.length > 0 ? getSortedArrayByKey(timeline, 'start') : null;
  return {
    slug: debateData.slug,
    logo: debateData.logo,
    topic: topic,
    dates: dates,
    introduction: introduction,
    objectives: objectives,
    video: video,
    headerLogoUrl: headerLogoUrl,
    headerBackgroundUrl: headerBackgroundUrl,
    timeline: sortedTimeline,
    helpUrl: debateData.help_url,
    termsOfUseUrl: prefs.terms_of_use_url,
    socialMedias: socialMedias,
    twitter: twitter,
    chatbot: chatbot,
    partners: partners,
    useSocialMedia: socialShare
  };
};

export const getDebateData = (debateId) => {
  const url1 = `/data/Discussion/${debateId}`;
  const url2 = `/data/Discussion/${debateId}/preferences`;
  const url3 = `/data/Discussion/${debateId}/timeline_events/`;
  const url4 = `/data/Discussion/${debateId}/settings/social_sharing`;
  const request1 = xmlHttpRequest({ method: 'GET', url: url1 });
  const request2 = xmlHttpRequest({ method: 'GET', url: url2 });
  const request3 = xmlHttpRequest({ method: 'GET', url: url3 });
  const request4 = xmlHttpRequest({ method: 'GET', url: url4 });
  return Promise.all([request1, request2, request3, request4]).then((results) => {
    const data = results[0];
    const prefs = results[1];
    const timeline = results[2];
    const socialShare = results[3];
    return buildDebateData(data, prefs[0], timeline, socialShare);
  });
};