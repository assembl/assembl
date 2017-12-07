// @flow

const getInputValue = (id: string) => {
  const elem = document.getElementById(id);
  const value = elem instanceof HTMLInputElement ? elem.value : null;
  return value;
};

const getScriptText = (id: string) => {
  const elem = document.getElementById(id);
  const text = elem instanceof HTMLScriptElement ? elem.text : null;
  return text;
};

export const getDiscussionId = () => getInputValue('discussion-id');

export const getDiscussionSlug = () => getInputValue('discussion-slug');

// cache userId to avoid accessing the dom at each permission check
let userId;
export const getConnectedUserId = () => {
  if (userId === undefined) {
    userId = getInputValue('user-id');
  }
  return userId;
};

export const getConnectedUserName = () => getInputValue('user-displayname');

// cache permissions to avoid accessing the dom at each permission check
let permissions;
export const getConnectedUserPermissions = () => {
  if (permissions === undefined) {
    const scriptText = getScriptText('permissions-json') || '[]';
    permissions = JSON.parse(scriptText);
  }
  return permissions;
};

export function getAuthorizationToken<T>(location: { query: { token: T } }) {
  return 'token' in location.query ? location.query.token : null;
}

export const getProvidersData = () => {
  const data = getScriptText('login-providers');
  try {
    return data && JSON.parse(data); // $flowfixme
  } catch (e) {
    return null;
  }
};

export const getPossibleErrorMessage = () => {
  const errorMessageElem = document.getElementById('errorMessage');
  const data = errorMessageElem && errorMessageElem.innerHTML;
  return data;
};

export function getSortedArrayByKey<KeyType>(arr: Array<{ [KeyType]: number }>, key: KeyType) {
  arr.sort((a, b) => {
    if (a[key] < b[key]) {
      return -1;
    } else if (a[key] > b[key]) {
      return 1;
    }
    return 0;
  });
  return arr;
}

export const isDateExpired = (date1: number, date2: number) => date1 > date2;

export const getNumberOfDays = (date1: number, date2: number) => {
  const days = (date1 - date2) / (1000 * 60 * 60 * 24);
  return Math.round(days);
};

export const calculatePercentage = (value1: number, value2: number) => Math.round(value1 * 100 / value2 * 100) / 100;

/*
  Handrolled instead of using lodash
  Because lodash/capitalize lowercases everything else
*/
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const getDocumentScrollTop = () =>
  window.pageYOffset ||
  (document.documentElement && document.documentElement.scrollTop) ||
  (document.body && document.body.scrollTop) ||
  0;

export const getDomElementOffset = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const scrollTop = getDocumentScrollTop();
  const scrollLeft =
    window.pageXOffset ||
    (document.documentElement && document.documentElement.scrollLeft) ||
    (document.body && document.body.scrollLeft) ||
    0;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
};

export const computeDomElementOffset = (ref: HTMLElement, offset: { top?: number, left?: number }) => {
  // inspired from jquery.setOffset
  const curOffset = getDomElementOffset(ref);
  const curCSS = window.getComputedStyle(ref);
  const curTop = parseFloat(curCSS.top) || 0;
  const curLeft = parseFloat(curCSS.left) || 0;
  const result = { top: curTop, left: curLeft };

  if (typeof offset.top === 'number') result.top = offset.top - curOffset.top + curTop;
  if (typeof offset.left === 'number') result.left = offset.left - curOffset.left + curLeft;
  return result;
};

export const createEvent = (
  typeArg: string,
  eventInit: { bubbles: boolean, cancelable: boolean } = { bubbles: false, cancelable: false }
) => {
  // inspired from https://developer.mozilla.org/en-US/docs/Web/API/Event/Event
  const event = document.createEvent('Event'); // we can't use 'new Event()' because ie
  event.initEvent(typeArg, eventInit.bubbles, eventInit.cancelable);
  return event;
};

/*
  Get basename from a unix or windows path
*/
export const getBasename = (path: string) =>
  path
    .split('\\')
    .pop()
    .split('/')
    .pop();

export const hashLinkScroll = () => {
  const { hash } = window.location;
  if (hash !== '') {
    const id = hash.replace('#', '').split('?')[0];
    // Push onto callback queue so it runs after the DOM is updated,
    // this is required when navigating from a different page so that
    // the element is rendered on the page before trying to getElementById.
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = getDomElementOffset(element).top - 160;
        window.scrollTo({ top: offset, left: 0, behavior: 'smooth' });
      }
    }, 0);
  }
};

export const hexToRgb = (c: string) => {
  if (!c) return '';
  const hex = c.replace(/[^0-9A-F]/gi, '');
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255; // eslint-disable-line
  const g = (bigint >> 8) & 255; // eslint-disable-line
  const b = bigint & 255; // eslint-disable-line

  return [r, g, b].join();
};

export const isMobile = {
  android: () => navigator.userAgent.match(/Android/i),
  blackberry: () => navigator.userAgent.match(/BlackBerry/i),
  ios: () => navigator.userAgent.match(/iPhone|iPad|iPod/i),
  opera: () => navigator.userAgent.match(/Opera Mini/i),
  windows: () => navigator.userAgent.match(/IEMobile/i),
  any: () => isMobile.android() || isMobile.blackberry() || isMobile.ios() || isMobile.opera() || isMobile.windows()
};

// works for SCREAMING_SNAKE_CASE, snake_case or cRazY_SNAKE_case
export const snakeToCamel = (string: string) => string.toLowerCase().replace(/_[a-z]/g, match => match[1].toUpperCase());