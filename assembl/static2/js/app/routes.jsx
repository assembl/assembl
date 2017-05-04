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
import Administration from './pages/administration';
import SurveyAdmin from './pages/surveyAdmin';
import ThreadAdmin from './pages/threadAdmin';
import { routeForRouter } from './utils/routeMap';

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

const AdminChild = (props) => {
  switch (props.params.phase) {
  case 'survey':
    return <SurveyAdmin />;
  case 'thread':
    return <ThreadAdmin />;
  case 'twoColumns':
    return <SurveyAdmin />;
  case 'tokenVote':
    return <SurveyAdmin />;
  default:
    return <SurveyAdmin />;
  }
};

export default (
  <Router>
    <Route path="/" component={Root}>
      <Route path={routeForRouter('styleguide', false, { preSlash: true })} component={Styleguide} />
      {/* Those login routes should be kept in synchrony with assembl.views.auth.__init__.py */}
      <Route path={routeForRouter('login', false, { preSlash: true })} component={Login} />
      <Route path={routeForRouter('signup', false, { preSlash: true })} component={Signup} />
      <Route path={routeForRouter('changePassword', false, { preSlash: true })} component={ChangePassword} />
      <Route path={routeForRouter('requestPasswordChange')} component={RequestPasswordChange} />
      {/* These are contextual routes for the ones above */}
      <Route path={routeForRouter('login', true)} component={Login} />
      <Route path={routeForRouter('signup', true)} component={Signup} />
      <Route path={routeForRouter('changePassword', true)} component={ChangePassword} />
      <Route path={routeForRouter('requestPasswordChange', true)} component={RequestPasswordChange} />
      <Route component={App}>
        <Route component={Main}>
          <Route path={routeForRouter('home')} component={Home} />
          <Route path={routeForRouter('homeBare')} component={Home} />
          <Route path={routeForRouter('profile', false, { userId: ':userId' })} component={Profile} />
          <Route path={routeForRouter('synthesis')} component={Synthesis} />
          <Route path={routeForRouter('community')} component={Community} />
          <Route path={routeForRouter('terms')} component={Terms} />
          <Route path={routeForRouter('debate')} component={Debate}>
            <Route path={routeForRouter('phase', false, { phase: ':phase', themeId: ':themeId' })} component={DebateChild} />
          </Route>
          <Route path={routeForRouter('administration')} component={Administration} >
            <Route path={routeForRouter('adminPhase', false, { phase: ':phase' })} component={AdminChild} />
          </Route>
        </Route>
      </Route>
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);