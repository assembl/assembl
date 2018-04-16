import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { Router, useRouterHistory } from 'react-router';
import { createHistory, useBeforeUnload } from 'history';

import PiwikReactRouter from 'piwik-react-router';
import { ApolloProvider } from 'react-apollo';
import get from 'lodash/get';
import 'bootstrap/dist/css/bootstrap.css';
import createAppStore from './store';
import client from './client';
import Routes from './routes';
import hashLinkScroll from './utils/hashLinkScroll';
import { ScreenDimensionsProvider } from './components/common/screenDimensions';

require('smoothscroll-polyfill').polyfill();

// tweak browser history to display a message if user triggers a hard transition but has unsaved changes
// see https://github.com/ReactTraining/react-router/issues/3147#issuecomment-200572190
const history = useBeforeUnload(useRouterHistory(createHistory))();

const store = createAppStore();

let customBrowserHistory;
const isPiwikEnabled = get(window, ['globalAnalytics', 'piwik', 'isActive'], false);
if (isPiwikEnabled) {
  const piwik = PiwikReactRouter({
    alreadyInitialized: true,
    enableLinkTracking: false // this option has already been activated in the piwik tracking script present in the DOM
  });
  customBrowserHistory = piwik.connectToHistory(history);
} else {
  customBrowserHistory = history;
}

const renderAssembl = (routes) => {
  ReactDOM.render(
    <AppContainer>
      <ApolloProvider store={store} client={client}>
        <ScreenDimensionsProvider>
          <Router history={customBrowserHistory} routes={routes} onUpdate={hashLinkScroll} />
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