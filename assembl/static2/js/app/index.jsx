import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { Router, browserHistory } from 'react-router';
import { ApolloProvider } from 'react-apollo';
import 'bootstrap/dist/css/bootstrap.css';
import createAppStore from './store';
import client from './client';
import Routes from './routes';

const store = createAppStore();


ReactDOM.render(
  <AppContainer>
    <ApolloProvider store={store} client={client}>
      <Router history={browserHistory} routes={Routes} />
    </ApolloProvider>
  </AppContainer>,
  document.getElementById('root')
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./routes', () => {
    const NewRoutes = require('./routes').default;  // eslint-disable-line
    ReactDOM.render(
      <AppContainer>
        <ApolloProvider store={store} client={client}>
          <Router history={browserHistory} routes={NewRoutes} />
        </ApolloProvider>
      </AppContainer>,
      document.getElementById('root')
    );
  });
}