'use strict'

var Analytics = require('../internal_modules/analytics/dispatcher.js');

// Enum of conversion between sentiment to statistics
var SENTIMENT_TO_STASTICS = {
  LikeSentimentOfPost: 'like',
  DisagreeSentimentOfPost: 'disagree',
  DontUnderstandSentimentOfPost: 'idu',
  MoreInfoSentimentOfPost: 'more',
  DESELECT: 'deselect'
};


/**
 * Method that converts the backend-based name of the sentiment
 * to an event name prepared for statistics
 *
 * Note: Pass 'DESELECT' in order to track sentiment deselection
 */
function fireSentimentAnalyticsEvent(sentiment){
  if (!(SENTIMENT_TO_STASTICS[sentiment])){
    // console.log("sentiment " + sentiment + " is not a valid sentiment. Will not process analytics");
    return;
  }

  var analytics = Analytics.getInstance();
  switch (SENTIMENT_TO_STASTICS[sentiment]){
    case 'like':
      analytics.trackEvent(analytics.events.SELECT_SENTIMENT_LIKE);
      break;
    case 'disagree':
      analytics.trackEvent(analytics.events.SELECT_SENTIMENT_DISAGREE);
      break;
    case 'idu':
      analytics.trackEvent(analytics.events.SELECT_SENTIMENT_DU);
      break;
    case 'more':
      analytics.trackEvent(analytics.events.SELECT_SENTIMENT_MORE);
      break;
    case 'deselect':
      analytics.trackEvent(analytics.events.DESELECT_SENTIMENT);
      break;
    default:
      throw Exception("Sentiment " + sentiment + " is not a valid sentiment to track!");
  }
};

module.exports = fireSentimentAnalyticsEvent;
