import 'babel-polyfill';
import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { AppContainer } from 'react-hot-loader';
import { Router } from 'react-router';

import createAppStore from './store';
import client from './client';
import Routes from './routes';
import hashLinkScroll from './utils/hashLinkScroll';
import { ScreenDimensionsProvider } from './components/common/screenDimensions';
import { browserHistory } from './router';

require('smoothscroll-polyfill').polyfill();

const store = createAppStore();

const renderAssembl = (routes) => {
  ReactDOM.render(
    <AppContainer>
      <ApolloProvider store={store} client={client}>
        <ScreenDimensionsProvider>
          <Router
            history={browserHistory}
            routes={routes}
            onUpdate={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              hashLinkScroll();
            }}
          />
        </ScreenDimensionsProvider>
      </ApolloProvider>
    </AppContainer>,
    document.getElementById('root')
  );
};

renderAssembl(Routes);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./routes', () => {
    const NewRoutes = require('./routes').default; // eslint-disable-line
    renderAssembl(NewRoutes);
  });
}