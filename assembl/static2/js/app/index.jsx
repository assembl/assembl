import React from 'react';
import ReactDOM from 'react-dom';
import { Router, browserHistory } from 'react-router';
import { ApolloProvider } from 'react-apollo';
import 'bootstrap/dist/css/bootstrap.css';
import '../../css/main.scss';
import { createAppStore } from './store';
import client from './client';
import Routes from './routes';

const store = createAppStore();

ReactDOM.render(
  <ApolloProvider store={store} client={client}>
    <Router history={browserHistory} routes={Routes} />
  </ApolloProvider>,
  document.getElementById('root')
);