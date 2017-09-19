import { I18n } from 'react-redux-i18n';

import deepen from './deepen';
import Translations from './translations';
import ja from '../../../translations/ja.json';

Translations.ja = deepen(ja);

const fallbackLocale = 'en';
const myHandleMissingTranslation = function (key, replacements) {
  // We need to use a function, not a arrow function here to be able to use 'this'.
  let translation = '';
  try {
    translation = this._fetchTranslation(this._translations, `${fallbackLocale}.${key}`, replacements.count); // eslint-disable-line
  } catch (err) {
    return `Missing translation: ${key}`;
  }
  return this._replace(translation, replacements); // eslint-disable-line
};
I18n.setHandleMissingTranslation(myHandleMissingTranslation);

export const getTranslations = () => {
  return Translations;
};

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

// cache userId to avoid accessing the dom at each permission check
// This is the effective user id, depends on being a participant
let effectiveUserId;
export const getConnectedUserId = () => {
  if (effectiveUserId === undefined) {
    effectiveUserId = document.getElementById('user-id') ? document.getElementById('user-id').value : null;
  }
  return effectiveUserId;
};

// cache userId to avoid accessing the dom at each permission check
// This tells the user id even of a non-participant
let userLoggedInId;
export const getLoggedInUserId = () => {
  if (userLoggedInId === undefined) {
    userLoggedInId = document.getElementById('user-login-id') ? document.getElementById('user-login-id').value : null;
  }
  return userLoggedInId;
};

export const getConnectedUserName = () => {
  const userName = document.getElementById('user-displayname') ? document.getElementById('user-displayname').value : null;
  return userName;
};

// cache permissions to avoid accessing the dom at each permission check
let permissions;
export const getConnectedUserPermissions = () => {
  if (permissions === undefined) {
    permissions = document.getElementById('permissions-json') ? document.getElementById('permissions-json').text : '[]';
    permissions = JSON.parse(permissions);
  }
  return permissions;
};

export const getAuthorizationToken = (location) => {
  return 'token' in location.query ? location.query.token : null;
};

export const getProvidersData = () => {
  const data = document.getElementById('login-providers') ? document.getElementById('login-providers').text : null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const getPossibleErrorMessage = () => {
  const data = document.getElementById('errorMessage') ? document.getElementById('errorMessage').innerHTML : null;
  return data;
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
  return Math.round(value1 * 100 / value2 * 100) / 100;
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