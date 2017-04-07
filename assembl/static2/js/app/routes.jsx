import React from 'react';
import { Router, Route } from 'react-router';
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


/*
  TODO: Create a cache of all of the routes, with routeNames, so that
  throughout the app, we can call upon these paths. Variables must be
  allowed.
  eg. router.getRouteFor("login", {slug: 'discussion_slug'})
  // => '/discussion_slug/login'
*/

class RoutesMap {
  constructor() {
    this._routes = {
      'styleguide': "/styleguide",
      'login': "/login",
      'signup': "signup",
      'changePassword': "changePassword",
      'requestPasswordChange': 'requestPasswordChange',
      'cxtLogin': "${slug}/login",
      'cxtSignup': "${slug}/signup",
      'cxtChangePassword': "${slug}/changePassword",
      'cxtRequestPasswordChange': "${slug}/req_password_change",
      'home': "${slug}/home",
      'profile': "${slug}/profile/${userId}",
      'ideas': "${slug}/ideas",
      'synthesis': "${slug}/synthesis",
      'debate': "${slug}/debate",
      'community': "${slug}/community",
      'terms': "${slug}/terms"
    };
  }

  get(name, args){
    let literal = this._routes[name];
    let a = parse(literal, args);
    return a;
  }
}

export let Routes = new RoutesMap();


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
    <Route path="/req_password_change" component={RequestPasswordChange} />
    <Route path="/" component={App}>
      <Route path=":slug/login" component={Login} />
      <Route path=":slug/signup" component={Signup} />
      <Route path=":slug/changePassword" component={ChangePassword} />
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
      </Route>
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);