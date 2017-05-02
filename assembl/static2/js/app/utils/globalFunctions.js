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
  const userId = document.getElementById('user-id') ? document.getElementById('user-id').value : null;
  return userId;
};

export const getConnectedUserName = () => {
  const userName = document.getElementById('user-displayname') ? document.getElementById('user-displayname').value : null;
  return userName;
};

export const getAuthorizationToken = () => {
  return document.getElementById('token') ? document.getElementById('token').text : null;
};

export const getProvidersData = () => {
  const data = document.getElementById('login-providers') ? document.getElementById('login-providers').text : null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
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

/*
  Handrolled instead of using lodash
  Because lodash/capitalize lowercases everything else
*/
export const capitalize = (s) => {
  return s.charAt(0).toUpperCase() + s.slice(1);
};


export const getDocumentScrollTop = () => {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
};

export const getDomElementOffset = (el) => {
  const rect = el.getBoundingClientRect();
  const scrollTop = getDocumentScrollTop();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
};

let scrollInterval;

export const scrollToPosition = (to, duration) => {
  const startPosition = getDocumentScrollTop();
  if (startPosition === to) return;
  clearInterval(scrollInterval);
  const diff = to - startPosition;
  const scrollStep = Math.PI / (duration / 10);
  let count = 0;
  let currPos = 0;
  const start = startPosition;
  scrollInterval = setInterval(() => {
    if ((Math.round(getDocumentScrollTop() / 20) * 20) !== (Math.round(to / 20) * 20)) {
      count += 1;
      currPos = start + (diff * (0.5 - (0.5 * Math.cos(count * scrollStep))));
      document.body.scrollTop = currPos; // Chrome/FF
      document.documentElement.scrollTop = currPos; // Firefox
    } else {
      clearInterval(scrollInterval);
    }
  }, 10);
};