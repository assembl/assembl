import React from 'react';
import { Router, Route } from 'react-router';
import App from './app';
import Main from './main';
import Login from './pages/login';
import Signup from './pages/signup';
import ChangePassword from './pages/changePassword';
import Home from './pages/home';
import Ideas from './pages/ideas';
import Synthesis from './pages/synthesis';
import Debate from './pages/debate';
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
        <Route path=":slug/ideas" component={Ideas} />
        <Route path=":slug/synthesis" component={Synthesis} />
        <Route path=":slug/debate" component={Debate} />
        <Route path=":slug/community" component={Community} />
        <Route path=":slug/terms" component={Terms} />
      </Route>
    </Route>
    <Route path="*" component={NotFound} />
  </Router>
);