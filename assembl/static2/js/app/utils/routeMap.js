/*
  A global map of routes managed by React front-end.
*/
/* eslint no-template-curly-in-string: "off", import/no-unresolved: "off", class-methods-use-this: "off" */
import urljoin from 'url-join';
import parse from './literalStringParser';
import { capitalize, getDiscussionSlug } from './globalFunctions';

class RouteMap {
  constructor() {
    this.slug = getDiscussionSlug();
    this.routes = {
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
  }
  basePath() {
    return `${window.location.protocol}//${window.location.host}`;
  }
  convertToContextualName(name) {
    const base = 'ctx';
    const workingName = capitalize(name);
    return base + workingName;
  }
  maybePrependSlash(pre, s) {
    return pre ? `/${s}` : s;
  }
  get(name, args) {
    const newArgs = args || {};
    const pre = ('preSlash' in newArgs) ? newArgs.preSlash : true;
    const isCtx = 'ctx' in newArgs ? newArgs.ctx : false;

    const newName = isCtx ? this.convertToContextualName(name) : name;
    if (!(newName in this.routes)) {
      throw Error(`${newName} is not a valid path!`);
    }

    let literal = this.routes[newName];
    literal = this.maybePrependSlash(pre, literal);
    const a = parse(literal, newArgs);
    return a;
  }
  getContextual(name, args) {
    const newArgs = { ...args, ctx: true }; // Do not mutate args!
    return this.get(name, newArgs);
  }
  getFullPath(name, args) {
    const rel = this.get(name, { ...args, preSlash: false });
    return urljoin(this.basePath(), rel);
  }
  routeForRouter(name, isCtx, args) {
    const newArgs = args || {};
    newArgs.slug = ':slug';
    newArgs.preSlash = newArgs.preSlash ? newArgs.preSlash : false;
    if (isCtx) { return this.getContextual(name, newArgs); }
    return this.get(name, newArgs);
  }
  getWithSlug(name, args) {
    const newArgs = { ...args, slug: this.slug };
    return this.get(name, newArgs);
  }
  getFullPathWithSlug(name, args) {
    const newArgs = { ...args, slug: this.slug };
    return this.getFullPath(name, newArgs);
  }
  getCurrentView() {
    return window.location.pathname;
  }
  matchPath(path, routeName, args) {
    const path2 = this.get(routeName, args);
    return path === path2;
  }
  matchContextualPath(path, routeName, args) {
    const newArgs = { ...args, ctx: true };
    return this.matchPath(path, routeName, newArgs);
  }
}

const Routes = new RouteMap();
export default Routes;