/*
  A global map of routes managed by React front-end.
*/
/* eslint no-template-curly-in-string: "off", import/no-unresolved: "off", class-methods-use-this: "off" */
import urljoin from 'url-join';
import cloneDeep from 'lodash/clonedeep';
import parse from './literalStringParser';
import { capitalize, getDiscussionSlug } from './globalFunctions';

// TODO: Add a constructor to include the discussion slug, if available in the DOM,
// so that a simplified method call can be made without passing the slug in each
// component
class RouteMap {
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
    const newArgs = cloneDeep(args); // Do not mutuate args!!
    newArgs.ctx = true;
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
    return window.location.href;
  }
}

const Routes = new RouteMap();
export default Routes;