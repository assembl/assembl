import React from 'react';
import { Router, Route, IndexRoute } from 'react-router';
import App from './containers/app';
import Authentication from './containers/authentication';
import Home from './containers/home';
import Ideas from './containers/ideas';
import Synthesis from './containers/synthesis';
import Debate from './containers/debate';
import Community from './containers/community';
import Styleguide from './containers/styleguide';
import NotFound from './containers/notFound';

export default (
  <Router>
    <Route component={App}>
      <IndexRoute component={Home} />
      <Route path="/v2/:slug/home" component={Home} />
      <Route path="/v2/:slug/authentication" component={Authentication} />
      <Route path="/v2/:slug/ideas" component={Ideas} />
      <Route path="/v2/:slug/synthesis" component={Synthesis} />
      <Route path="/v2/:slug/debate" component={Debate} />
      <Route path="/v2/:slug/community" component={Community} />
    </Route>
    <Route path="/v2/:slug/styleguide" component={Styleguide} />
    <Route path="*" component={NotFound} />
  </Router>
);