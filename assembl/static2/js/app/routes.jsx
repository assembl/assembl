import React from 'react';
import { Route } from 'react-router';
import Authentication from './containers/authentication';
import Home from './containers/home';
import Ideas from './containers/ideas';
import Synthesis from './containers/synthesis';
import Debate from './containers/debate';

export default (
  <Route>
    <Route path="/:slug/authentication" component={Authentication} />
    <Route path="/:slug/home" component={Home} />
    <Route path="/:slug/ideas" component={Ideas} />
    <Route path="/:slug/synthesis" component={Synthesis} />
    <Route path="/:slug/debate" component={Debate} />
  </Route>
);