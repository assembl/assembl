/* eslint no-template-curly-in-string: "off", import/no-unresolved: "off" */

import React from 'react';
import { Router, Route } from 'react-router';
import urljoin from 'url-join';
import cloneDeep from 'lodash/clonedeep';
import App from './app';
import Main from './main';
import Login from './pages/login';
import Signup from './pages/signup';
import ChangePassword from './pages/changePassword';
import RequestPasswordChange from './pages/requestPasswordChange';
import Home from './pages/home';
import Synthesis from './pages/synthesis';
import Debate from './pages/debate';
import Survey from './pages/survey';
import Thread from './pages/thread';
import TwoColumns from './pages/twoColumns';
import TokenVote from './pages/tokenVote';
import Community from './pages/community';
import Profile from './pages/profile';
import Styleguide from './pages/styleguide';
import NotFound from './pages/notFound';
import Terms from './pages/terms';
import parse from './utils/literalStringParser';
import { capitalize } from './utils/globalFunctions';


/*
  TODO: Create a cache of all of the routes, with routeNames, so that
  throughout the app, we can call upon these paths. Variables must be
  allowed.
  eg. router.getRouteFor("login", {slug: 'discussion_slug'})
  // => '/discussion_slug/login'
*/

class RoutesMap {
  static basePath() {
    return `${window.location.protocol}//${window.location.host}`;
  }

  static convertToContextualName(name) {
    const base = 'ctx';
    const workingName = capitalize(name);
    return base + workingName;
  }

  static maybePrependSlash(pre, s) {
    return pre ? `/${s}` : s;
  }

  constructor() {
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
      terms: '${slug}/terms'
    };
  }


  get(name, args) {
    // Shitty way to enforce a boolean type without crashing
    const newArgs = args || {};
    const pre = !(('preSlash' in newArgs && newArgs.preSlash === false));
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
    const rel = this.get(name, args);
    return urljoin(this.basePath(), rel);
  }
}

export const Routes = new RoutesMap();

const getRouteForRouter = (name, isCtx, args) => {
  const newArgs = args || {};
  newArgs.slug = ':slug';
  newArgs.preSlash = false;
  if (isCtx) { return Routes.getContextual(name, newArgs); }
  return Routes.get(name, newArgs);
};

const DebateChild = (props) => {
  switch (props.params.phase) {
  case 'survey':
    return <Survey id={props.id} identifier={props.identifier} />;
  case 'thread':
    return <Thread id={props.id} identifier={props.identifier} />;
  case 'twoColumns':
    return <TwoColumns id={props.id} identifier={props.identifier} />;
  case 'tokenVote':
    return <TokenVote id={props.id} identifier={props.identifier} />;
  default:
    return <Survey id={props.id} identifier={props.identifier} />;
  }
};

export default (
  <Router>
    <Route path="/styleguide" component={Styleguide} />
    {/* Those login routes should be kept in synchrony with assembl.views.auth.__init__.py */}
    <Route path="/login" component={Login} />
    <Route path="/signup" component={Signup} />
    <Route path="/changePassword" component={ChangePassword} />
    <Route path={getRouteForRouter('requestPasswordChange')} component={RequestPasswordChange} />
    <Route path="/" component={App}>
      <Route path={getRouteForRouter('login', true)} component={Login} />
      <Route path={getRouteForRouter('signup', true)} component={Signup} />
      <Route path={getRouteForRouter('changePassword', true)} component={ChangePassword} />
      <Route path={getRouteForRouter('requestPasswordChange', true)} component={RequestPasswordChange} />
      <Route component={Main}>
        <Route path=":slug/home" component={Home} />
        <Route path=":slug/profile/:userId" component={Profile} />
        <Route path=":slug/home" component={Home} />
        <Route path=":slug/synthesis" component={Synthesis} />
        <Route path=":slug/debate" component={Debate}>
          <Route path=":phase/theme/:themeId" component={DebateChild} />
        </Route>
        <Route path=":slug/community" component={Community} />
        <Route path=":slug/terms" component={Terms} />
        <Route path=":slug/req_password_change" component={RequestPasswordChange} />
        <Route path={getRouteForRouter('home')} component={Home} />
        <Route path={getRouteForRouter('profile', false, { userId: ':userId' })} component={Profile} />
        <Route path={getRouteForRouter('ideas')} component={Ideas} />
        <Route path={getRouteForRouter('synthesis')} component={Synthesis} />
        <Route path={getRouteForRouter('debate')} component={Debate} />
        <Route path={getRouteForRouter('community')} component={Community} />
        <Route path={getRouteForRouter('terms')} component={Terms} />
      </Route>
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);