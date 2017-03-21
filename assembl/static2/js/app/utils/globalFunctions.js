import Translations from './translations';

export const getLocale = (browserLanguage) => {
  let locale = browserLanguage.split('-')[0].toLowerCase();
  if (!Translations[locale]) locale = 'en';
  return locale;
};

export const getAvailableLocales = (locale, translations) => {
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

export const getDiscussionSlug = () => {
  return document.getElementById('discussion-slug') ? document.getElementById('discussion-slug').value : null;
};

export const getConnectedUserId = () => {
  const userId = document.getElementById('user-id') ? document.getElementById('user-id').value: null;
  return userId;
};

export const getConnectedUserName = () => {
  const userName = document.getElementById('user-displayname') ? document.getElementById('user-displayname').value : null;
  return userName;
};

export const getSortedArrayByKey = (arr, key) => {
  arr.sort((a, b) => {
    if (a[key] < b[key]) {
      return -1;
    } else if (a[key] > b[key]) {
      return 1;
    }
    return 0;
  });
  return arr;
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

export const getDomElementOffset = (el) => {
  const rect = el.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
};

let scrollInterval;

export const scrollToElement = (element, to, duration) => {
  if (element.scrollTop === to) return;
  clearInterval(scrollInterval);
  const diff = to - element.scrollTop;
  const scrollStep = Math.PI / (duration / 10);
  let count = 0;
  let currPos = 0;
  const start = element.scrollTop;
  scrollInterval = setInterval(() => {
    if ((Math.round(element.scrollTop / 10) * 10) !== (Math.round(to / 10) * 10)) {
      count += 1;
      currPos = start + (diff * (0.5 - (0.5 * Math.cos(count * scrollStep))));
      element.scrollTop = currPos; //eslint-disable-line
    } else {
      clearInterval(scrollInterval);
    }
  }, 10);
};