import urljoin from 'url-join';
import parse from './literalStringParser';
import { capitalize } from './globalFunctions';
/*
  A global map of routes managed by React front-end.
*/

const routes = require('../../../routes.json');

const convertToContextualName = (name) => {
  const base = 'ctx';
  const workingName = capitalize(name);
  return base + workingName;
};
const maybePrependSlash = (pre, s) => (pre ? `/${s}` : s);
export const get = (name, args) => {
  const newArgs = args || {};
  const pre = 'preSlash' in newArgs ? newArgs.preSlash : true;
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
const basePath = () => `${window.location.protocol}//${window.location.host}`;
export const getFullPath = (name, args) => {
  const rel = get(name, { ...args, preSlash: false });
  return urljoin(basePath(), rel);
};
export const getContextual = (name, args) => {
  const newArgs = { ...args, ctx: true }; // Do not mutate args!
  return get(name, newArgs);
};
export const routeForRouter = (name, isCtx, args) => {
  const newArgs = args || {};
  newArgs.slug = ':slug';
  newArgs.preSlash = newArgs.preSlash ? newArgs.preSlash : false;
  if (isCtx) {
    return getContextual(name, newArgs);
  }
  return get(name, newArgs);
};
export const getCurrentView = () => window.location.pathname;
/* Not use for the moment, but maybe later

const slug = getDiscussionSlug();
const getWithSlug = (name, args) => {
  const newArgs = { ...args, slug: slug };
  return get(name, newArgs);
};
const getFullPathWithSlug = (name, args) => {
  const newArgs = { ...args, slug: slug };
  return getFullPath(name, newArgs);
};
const matchContextualPath = (path, routeName, args) => {
  const newArgs = { ...args, ctx: true };
  return matchPath(path, routeName, newArgs);
};
const matchPath = (path, routeName, args) => {
  const path2 = get(routeName, args);
  return path === path2;
};
*/