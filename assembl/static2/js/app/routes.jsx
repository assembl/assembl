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

export default (
  <Router>
    <Route component={App}>
      <Route component={Main}>
        <Route path=":slug/home" component={Home} />
      </Route>
    </Route>
    <Route path="/v2/styleguide" component={Styleguide} />
    <Route path="/v2/" component={App}>
      <Route path=":slug/login" component={Login} />
      <Route path=":slug/signup" component={Signup} />
      <Route path=":slug/changePassword" component={ChangePassword} />
      <Route component={Main}>
        <Route path=":slug/profile/:userId" component={Profile} />
        <Route path=":slug/home" component={Home} />
        <Route path=":slug/synthesis" component={Synthesis} />
        <Route path=":slug/debate" component={Debate}>
          <Route path="survey/theme/:id" component={Survey} />
          <Route path="thread/theme/:id" component={Thread} />
          <Route path="twoColumns/theme/:id" component={TwoColumns} />
          <Route path="tokenVote/theme/:id" component={TokenVote} />
        </Route>
        <Route path=":slug/community" component={Community} />
        <Route path=":slug/terms" component={Terms} />
      </Route>
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);