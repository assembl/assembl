import React from 'react';
import { Route } from 'react-router';
import Authentication from './containers/authentication';
import Home from './containers/home';
import Ideas from './containers/ideas';
import Synthesis from './containers/synthesis';
import Debate from './containers/debate';
import NotFound from './containers/notFound';

export default (
  <Route>
    <Route path="/v2/:slug/authentication" component={Authentication} />
    <Route path="/v2/:slug/home" component={Home} />
    <Route path="/v2/:slug" component={Home} />
    <Route path="/v2/:slug/ideas" component={Ideas} />
    <Route path="/v2/:slug/synthesis" component={Synthesis} />
    <Route path="/v2/:slug/debate" component={Debate} />
    <Route path="*" component={NotFound} />
  </Route>
);