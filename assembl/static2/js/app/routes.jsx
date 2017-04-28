import React from 'react';
import { Router, Route } from 'react-router';
import Root from './root';
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
import Routes from './utils/routeMap';

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
    <Route path="/" component={Root}>
      <Route path={Routes.routeForRouter('styleguide', false, { preSlash: true })} component={Styleguide} />
      {/* Those login routes should be kept in synchrony with assembl.views.auth.__init__.py */}
      <Route path={Routes.routeForRouter('login', false, { preSlash: true })} component={Login} />
      <Route path={Routes.routeForRouter('signup', false, { preSlash: true })} component={Signup} />
      <Route path={Routes.routeForRouter('changePassword', false, { preSlash: true })} component={ChangePassword} />
      <Route path={Routes.routeForRouter('requestPasswordChange')} component={RequestPasswordChange} />
      <Route component={App}>
        {/* These are contextual routes for the ones above */}
        <Route path={Routes.routeForRouter('login', true)} component={Login} />
        <Route path={Routes.routeForRouter('signup', true)} component={Signup} />
        <Route path={Routes.routeForRouter('changePassword', true)} component={ChangePassword} />
        <Route path={Routes.routeForRouter('requestPasswordChange', true)} component={RequestPasswordChange} />
        <Route component={Main}>
          <Route path={Routes.routeForRouter('home')} component={Home} />
          <Route path={Routes.routeForRouter('homeBare')} component={Home} />
          <Route path={Routes.routeForRouter('profile', false, { userId: ':userId' })} component={Profile} />
          <Route path={Routes.routeForRouter('synthesis')} component={Synthesis} />
          <Route path={Routes.routeForRouter('community')} component={Community} />
          <Route path={Routes.routeForRouter('terms')} component={Terms} />
          <Route path={Routes.routeForRouter('debate')} component={Debate}>
            <Route path={Routes.routeForRouter('phase', false, { phase: ':phase', themeId: ':themeId' })} component={DebateChild} />
          </Route>
        </Route>
      </Route>
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);