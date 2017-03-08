import Translations from './translations';

export const getLocale = (browserLanguage) => {
  let locale = browserLanguage.split('-')[0].toLowerCase();
  if (!Translations[locale]) locale = 'en';
  return locale;
};

export const getAvalaibleLocales = (locale, translations) => {
  const locArray = [];
  Object.keys(translations).map((key) => {
    if (key !== locale) locArray.push(key);
    return locArray;
  });
  return locArray;
};

export const getDiscussionId = () => {
  const discussionId = document.getElementById('discussion-id') ? document.getElementById('discussion-id').value : null;
  return discussionId;
};

export const getConnectedUserId = () => {
  const userId = document.getElementById('user-id') ? document.getElementById('user-id').value : null;
  return userId;
};

export const getSortedDate = (object, key) => {
  const sortedDate = object.map((item) => {
    const date = item[key];
    return new Date(date).getTime();
  }).sort();
  return sortedDate;
};

export const isDateExpired = (date1, date2) => {
  return date1 > date2;
};

export const getNumberOfDays = (date1, date2) => {
  const days = (date1 - date2) / (1000 * 60 * 60 * 24);
  return Math.round(days);
};

export const calculatePercentage = (value1, value2) => {
  return Math.round(((value1 * 100) / value2) * 100) / 100;
};