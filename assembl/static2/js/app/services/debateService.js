import { xmlHttpRequest } from '../utils/httpRequestHandler';

export const buildDebateData = (debateData, prefs, socialShare) => {
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
  const chatframe = prefs.extra_json && prefs.extra_json.chatframe ? prefs.extra_json.chatframe : null;
  const partners = prefs.extra_json && prefs.extra_json.partners ? prefs.extra_json.partners : null;
  const socialMedias = prefs.extra_json && prefs.extra_json.socialMedias ? prefs.extra_json.socialMedias : null;
  const footerLinks = prefs.extra_json && prefs.extra_json.footerLinks ? prefs.extra_json.footerLinks : null;
  const isLargeLogo = prefs.extra_json && prefs.extra_json.isLargeLogo ? prefs.extra_json.isLargeLogo : null;
  const requireSecureConnection = debateData.require_secure_connection ? debateData.require_secure_connection : null;

  const customHtmlCodeLandingPage = prefs.custom_html_code_landing_page ? prefs.custom_html_code_landing_page : null;
  const customHtmlCodeRegistrationPage = prefs.custom_html_code_user_registration_page
    ? prefs.custom_html_code_user_registration_page
    : null;

  return {
    translationEnabled: !!debateData.translation_service_class,
    slug: debateData.slug,
    logo: debateData.logo,
    topic: topic,
    dates: dates,
    introduction: introduction,
    objectives: objectives,
    video: video,
    headerLogoUrl: headerLogoUrl,
    headerBackgroundUrl: headerBackgroundUrl,
    helpUrl: debateData.help_url,
    termsOfUseUrl: prefs.terms_of_use_url,
    socialMedias: socialMedias,
    isLargeLogo: isLargeLogo,
    twitter: twitter,
    chatbot: chatbot,
    chatframe: chatframe,
    partners: partners,
    useSocialMedia: socialShare,
    customHtmlCodeLandingPage: customHtmlCodeLandingPage,
    customHtmlCodeRegistrationPage: customHtmlCodeRegistrationPage,
    footerLinks: footerLinks,
    requireSecureConnection: requireSecureConnection
  };
};

export const getDebateData = (debateId) => {
  const dataUrl = `/data/Discussion/${debateId}`;
  const prefsUrl = `/data/Discussion/${debateId}/preferences`;
  const socialShareUrl = `/data/Discussion/${debateId}/settings/social_sharing`;
  const dataRequest = xmlHttpRequest({ method: 'GET', url: dataUrl });
  const prefsRequest = xmlHttpRequest({ method: 'GET', url: prefsUrl });
  const socialShareRequest = xmlHttpRequest({ method: 'GET', url: socialShareUrl });
  return Promise.all([dataRequest, prefsRequest, socialShareRequest]).then((results) => {
    const data = results[0];
    const prefs = results[1];
    const socialShare = results[3];
    return buildDebateData(data, prefs[0], socialShare);
  });
};