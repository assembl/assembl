// @flow
import moment from 'moment';
import Cookies from 'js-cookie';
import type Moment from 'moment';
import { type Map } from 'immutable';
import type { SuggestedTags, Tags } from '../pages/semanticAnalysis/dataType';
import type { TagProps } from '../components/common/tags/tags';

import {
  ICONS_PATH,
  BM_PICTURE_BASE_URL,
  PICTURE_EXTENSION,
  PublicationStates,
  SM_SCREEN_WIDTH,
  LG_SCREEN_WIDTH,
  KEYWORD_SCORE_THRESHOLD
} from '../constants';

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

export const encodeUserIdBase64 = (userId: string | null) => (userId ? btoa(`AgentProfile:${userId}`) : null);

// cache userId to avoid accessing the dom at each permission check
let userId;
export const getConnectedUserId = (base64: boolean = false) => {
  if (userId === undefined) {
    userId = getInputValue('user-id');
  }
  return base64 ? encodeUserIdBase64(userId) : userId;
};

export const getConnectedUserName = () => getInputValue('user-displayname');

export const isConnectedUser = (currentUserId: ?number) => String(currentUserId) === getConnectedUserId();

export const moveElementToFirstPosition = (array: Array<any>, targetElement: any) => {
  const others = array.filter(elelement => elelement !== targetElement);
  return [targetElement, ...others];
};

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

export const isDateExpired = (date1: Date, date2: Date) => date1 > date2;

export const getNumberOfDays = (date1: Date, date2: Date) => {
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

export const isMobileSizedScreen = (screenWidth: number) => screenWidth < SM_SCREEN_WIDTH;
export const isTabletSizedScreen = (screenWidth: number) => screenWidth >= SM_SCREEN_WIDTH && screenWidth < LG_SCREEN_WIDTH;

// works for SCREAMING_SNAKE_CASE, snake_case or cRazY_SNAKE_case
export const snakeToCamel = (string: string) => string.toLowerCase().replace(/_[a-z]/g, match => match[1].toUpperCase());

export const getCookieItem = (sKey: string) => Cookies.get(sKey);

export function setCookieItem(name: string, value: any, sensitive: boolean = false) {
  const date = new Date();
  let v = null;

  date.setMonth(date.getMonth() + 13);
  const extras: Object = { path: '/', expires: date };
  if (sensitive) {
    extras.secure = true;
  }
  if (Array.isArray(value)) {
    v = value.join(',');
  } else {
    v = value;
  }
  Cookies.set(name, v, extras);
}

export function deleteCookieItem(name: string, path: string = '/') {
  Cookies.removeCookie(name, { path: path });
}

export const createRandomId = (): string => Math.round(Math.random() * -1000000).toString();

export const isOrContains = (n: any, c: any) => {
  const container = c;
  let node = n;
  while (node) {
    if (node === container) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

export const elementContainsSelection = (el: any) => {
  let sel;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount > 0) {
      for (let i = 0; i < sel.rangeCount; i += 1) {
        if (!isOrContains(sel.getRangeAt(i).commonAncestorContainer, el)) {
          return false;
        }
      }
      return true;
    }
    // $FlowFixMe Property selection is missing in Document
  } else if (sel && sel === document.selection && sel.type !== 'Control') {
    return isOrContains(sel.createRange().parentElement(), el);
  }
  return false;
};

type ItemsById = Map<string, any>;
/* move item up (i.e. change its order) in a *ById state */
export const moveItemUp = (itemsById: ItemsById, id: string): ItemsById => {
  let newItemsById = itemsById;
  let itemsInOrder = itemsById
    .filter(item => !item.get('_toDelete'))
    .sortBy(item => item.get('order'))
    .map(item => item.get('id'))
    .toList();
  const idx = itemsInOrder.indexOf(id);
  itemsInOrder = itemsInOrder.delete(idx).insert(idx - 1, id);
  let order = 1;
  itemsInOrder.forEach((itemId) => {
    if (newItemsById.getIn([itemId, 'order']) !== order) {
      newItemsById = newItemsById.setIn([itemId, 'order'], order).setIn([itemId, '_hasChanged'], true);
    }
    order += 1;
  });

  return newItemsById;
};

/* move item down (i.e. change its order) in a *ById state */
export const moveItemDown = (itemsById: ItemsById, id: string): ItemsById => {
  let newItemsById = itemsById;
  let itemsInOrder = itemsById
    .filter(item => !item.get('_toDelete'))
    .sortBy(item => item.get('order'))
    .map(item => item.get('id'))
    .toList();
  const idx = itemsInOrder.indexOf(id);
  itemsInOrder = itemsInOrder.delete(idx).insert(idx + 1, id);
  let order = 1;
  itemsInOrder.forEach((itemId) => {
    if (newItemsById.getIn([itemId, 'order']) !== order) {
      newItemsById = newItemsById.setIn([itemId, 'order'], order).setIn([itemId, '_hasChanged'], true);
    }
    order += 1;
  });
  return newItemsById;
};

export function fromGlobalId(id: string): string | null {
  return id ? atob(id).split(':')[1] : null;
}

export function getIconPath(icon: string, color: string = '') {
  return color ? `${ICONS_PATH}/${color}/${icon}` : `${ICONS_PATH}/${icon}`;
}

// We `pictureId + 1` because there is no image in the S3 bucket with 0 as an id
export const getPictureUrl = (pictureId: number) => `${BM_PICTURE_BASE_URL}${pictureId + 1}${PICTURE_EXTENSION}`;

export const getRouteLastString = (location: string): string => {
  const lastLocationString = /[^/]*$/.exec(location);
  return lastLocationString ? lastLocationString[0] : '';
};

export function compareByTextPosition(extractA: ?FictionExtractFragment, extractB: ?FictionExtractFragment) {
  // Sort extracts by position in body's paragraphs
  if (!!extractA && !!extractB) {
    const ATfi = extractA.textFragmentIdentifiers && extractA.textFragmentIdentifiers[0];
    const BTfi = extractB.textFragmentIdentifiers && extractB.textFragmentIdentifiers[0];
    const ATfiXPath = ATfi && ATfi.xpathStart;
    const BTfiXPath = BTfi && BTfi.xpathStart;

    const regex = /p\[([^)]+)\]/;
    const AMatchParagraph = ATfiXPath && ATfiXPath.match(regex);
    const BMatchParagraph = BTfiXPath && BTfiXPath.match(regex);

    if (!!AMatchParagraph && !!BMatchParagraph) {
      const AParagraph = parseInt(AMatchParagraph[1], 10);
      const BParagraph = parseInt(BMatchParagraph[1], 10);

      if (AParagraph > BParagraph) return 1;
      if (AParagraph === BParagraph) {
        // If extracts are in same paragraph, compare by offset
        const AOffsetStart = ATfi && ATfi.offsetStart;
        const BOffsetStart = BTfi && BTfi.offsetStart;
        if (!!AOffsetStart && !!BOffsetStart && AOffsetStart > BOffsetStart) return 1;
      }
    }
  }
  // For all other cases: (<), if extract null, not found in text => set first
  return -1;
}

export const convertISO8601StringToDate = (s: string): Moment => moment(s).utc();

export const convertToISO639String = (s: string): string => (s.match(/-|_/) ? s.split(/-|_/)[0] : s);

export const getPostPublicationState = (isDebateModerated: boolean, connectedUserIsModerator: boolean): string => {
  if (!isDebateModerated || connectedUserIsModerator) {
    return PublicationStates.PUBLISHED;
  }

  return PublicationStates.SUBMITTED_AWAITING_MODERATION;
};

// Lift flow error: Convert `SuggestedTags` to Array<string>, filter null values and filter score greater than KEYWORD_SCORE_THRESHOLD
export const formatedSuggestedTagList = (suggestedTags: SuggestedTags): Array<string> =>
  (suggestedTags
    ? suggestedTags.reduce((result, keyword) => {
      if (keyword) {
        const { score, value } = keyword;
        const newScore: number = score || 0;
        const newValue: string = value || '';
        if (newScore > KEYWORD_SCORE_THRESHOLD && newValue) {
          result.push(newValue);
        }
      }
      return result;
    }, [])
    : []);

// Lift flow error: Convert `Tags` to Array<Tag>
export const formatedTagList = (tags: Tags): Array<TagProps> =>
  (tags
    ? tags.reduce((result, tag) => {
      if (tag) {
        const { id, value } = tag;
        const newId = id || '';
        const newValue = value || '';
        result.push({ id: newId, text: newValue });
      }
      return result;
    }, [])
    : []);

// Function that checks whether the browser is IE from v6 to v11
// eslint-disable-next-line
const isIE = () => /*@cc_on!@*/ false || !!document.documentMode;

// Function that checks whether the browser is Edge
const isEdge = () => !isIE() && !!window.StyleMedia;

// Function that checks whether the browser is a Microsoft browser
export const isMicrosoftBrowser = () => isIE() || isEdge();