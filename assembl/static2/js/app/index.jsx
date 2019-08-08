// This is a workaround to using babel preset-env to add this polyfill. Assembl's current version is core-js2, and upgrading to core-js3 will add this polyfill.
// However, this will break current versions of apollo-client-upload, storybook, etc.
// TODO: Once Apollo-Client is upgraded to ^2.0.0, then please update core-js (and other dependencies) to ^3.0.0 so that the URL polyfill is included.
// This is currently a workaround to support the URL object.
import 'url-polyfill';
import 'core-js';
import 'regenerator-runtime/runtime';
import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import { AppContainer } from 'react-hot-loader';
import { Router } from 'react-router';

import createAppStore from './store';
import client from './client';
import Routes from './routes';
import hashLinkScroll from './utils/hashLinkScroll';
import { initializeSentry } from './utils/sentry';
import { ScreenDimensionsProvider } from './components/common/screenDimensions';
import { browserHistory } from './router';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';

require('smoothscroll-polyfill').polyfill();

const store = createAppStore();

const rootElement = document.getElementById('root');
initializeSentry(rootElement);

const renderAssembl = (routes) => {
  ReactDOM.render(
    <AppContainer>
      <ApolloProvider store={store} client={client}>
        <ScreenDimensionsProvider>
          <GlobalErrorBoundary>
            <Router
              history={browserHistory}
              routes={routes}
              onUpdate={() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                hashLinkScroll();
              }}
            />
          </GlobalErrorBoundary>
        </ScreenDimensionsProvider>
      </ApolloProvider>
    </AppContainer>,
    rootElement
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