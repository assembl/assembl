import { useRouterHistory } from 'react-router';
import { createHistory, useBeforeUnload } from 'history';
import PiwikReactRouter from 'piwik-react-router';
import get from 'lodash/get';

// tweak browser history to display a message if user triggers a hard transition but has unsaved changes
// see https://github.com/ReactTraining/react-router/issues/3147#issuecomment-200572190
const history = useBeforeUnload(useRouterHistory(createHistory))();

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

// create a const because to avoid to export mutables
const browserHistory = customBrowserHistory;
export { browserHistory };