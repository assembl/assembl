import urljoin from 'url-join';
import parse from './literalStringParser';
import { capitalize, getDiscussionSlug } from './globalFunctions';
/*
  A global map of routes managed by React front-end.
*/
/* eslint no-template-curly-in-string: "off", import/no-unresolved: "off", class-methods-use-this: "off" */
const slug = getDiscussionSlug();
const routes = {
  oldLogout: 'legacy/logout',
  oldLogin: 'debate/login',
  oldDebate: 'debate/${slug}',
  styleguide: 'styleguide',
  login: 'login',
  signup: 'signup',
  changePassword: 'changePassword',
  requestPasswordChange: 'requestPasswordChange',
  ctxLogin: '${slug}/login',
  ctxSignup: '${slug}/signup',
  ctxChangePassword: '${slug}/changePassword',
  ctxRequestPasswordChange: '${slug}/requestPasswordChange',
  ctxOldLogout: 'debate/${slug}/logout',
  ctxOldLogin: 'debate/${slug}/login',
  home: '${slug}/home',
  profile: '${slug}/profile/${userId}',
  ideas: '${slug}/ideas',
  synthesis: '${slug}/synthesis',
  debate: '${slug}/debate',
  community: '${slug}/community',
  terms: '${slug}/terms',
  phase: '${phase}/theme/${themeId}'
};

const basePath = () => {
  return `${window.location.protocol}//${window.location.host}`;
};
const convertToContextualName = (name) => {
  const base = 'ctx';
  const workingName = capitalize(name);
  return base + workingName;
};
const maybePrependSlash = (pre, s) => {
  return pre ? `/${s}` : s;
};
const getWithSlug = (name, args) => {
  const newArgs = { ...args, slug: slug };
  return get(name, newArgs);
};
const getFullPathWithSlug = (name, args) => {
  const newArgs = { ...args, slug: slug };
  return getFullPath(name, newArgs);
};
const matchPath = (path, routeName, args) => {
  const path2 = get(routeName, args);
  return path === path2;
};
const matchContextualPath = (path, routeName, args) => {
  const newArgs = { ...args, ctx: true };
  return matchPath(path, routeName, newArgs);
};
export const get = (name, args) => {
  const newArgs = args || {};
  const pre = ('preSlash' in newArgs) ? newArgs.preSlash : true;
  const isCtx = 'ctx' in newArgs ? newArgs.ctx : false;

  const newName = isCtx ? convertToContextualName(name) : name;
  if (!(newName in routes)) {
    throw Error(`${newName} is not a valid path!`);
  }

  let literal = routes[newName];
  literal = maybePrependSlash(pre, literal);
  const a = parse(literal, newArgs);
  return a;
};
export const getContextual = (name, args) => {
  const newArgs = { ...args, ctx: true }; // Do not mutate args!
  return get(name, newArgs);
};
export const getFullPath = (name, args) => {
  const rel = get(name, { ...args, preSlash: false });
  return urljoin(basePath(), rel);
};
export const routeForRouter = (name, isCtx, args) => {
  const newArgs = args || {};
  newArgs.slug = ':slug';
  newArgs.preSlash = newArgs.preSlash ? newArgs.preSlash : false;
  if (isCtx) { return getContextual(name, newArgs); }
  return get(name, newArgs);
};
export const getCurrentView = () => {
  return window.location.pathname;
};