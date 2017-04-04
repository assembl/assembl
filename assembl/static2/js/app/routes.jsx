import React from 'react';
import { Router, Route } from 'react-router';
import App from './app';
import Main from './main';
import Login from './pages/login';
import Signup from './pages/signup';
import ChangePassword from './pages/changePassword';
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
      </Route>
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);