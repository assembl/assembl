import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { Router, browserHistory } from 'react-router';
import PiwikReactRouter from 'piwik-react-router';
import { ApolloProvider } from 'react-apollo';
import get from 'lodash/get';
import 'bootstrap/dist/css/bootstrap.css';
import createAppStore from './store';
import client from './client';
import Routes from './routes';

require('smoothscroll-polyfill').polyfill();

/*
`piwik-react-router` expects that we provide it with a browser history.
We provide it with `react-router`'s `browserHistory`.
This is not the official way of doing it.
The official way is using the `history` library, called with `import history from './utils/history';`.
For details, see
https://github.com/ReactTraining/react-router/blob/master/FAQ.md#how-do-i-access-the-history-object-outside-of-components
*/
const history = browserHistory;

const store = createAppStore();

const isPiwikEnabled = get(window, ['globalAnalytics', 'piwik', 'isActive'], false);
let piwik;
if (isPiwikEnabled) {
  piwik = PiwikReactRouter({
    alreadyInitialized: true,
    enableLinkTracking: false // this option has already been activated in the piwik tracking script present in the DOM
  });
}
export const customBrowserHistory = isPiwikEnabled ? piwik.connectToHistory(history) : history;

ReactDOM.render(
  <AppContainer>
    <ApolloProvider store={store} client={client}>
      <Router history={customBrowserHistory} routes={Routes} />
    </ApolloProvider>
  </AppContainer>,
  document.getElementById('root')
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./routes', () => {
    const NewRoutes = require('./routes').default; // eslint-disable-line
    ReactDOM.render(
      <AppContainer>
        <ApolloProvider store={store} client={client}>
          <Router history={customBrowserHistory} routes={NewRoutes} />
        </ApolloProvider>
      </AppContainer>,
      document.getElementById('root')
    );
  });
}