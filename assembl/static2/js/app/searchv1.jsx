import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import Thunk from 'redux-thunk';
import { loadTranslations, setLocale, syncTranslationWithStore } from 'react-redux-i18n';
import RootReducer from './reducers/rootReducer';
import GlobalFunctions from './utils/globalFunctions';
import Translations from './utils/translations';
import { canUseExpertInterface } from './utils/permissions';
import { fetchPermissionsForUser } from './services/userService';

import { SearchComponent } from './components/search.jsx?v=1'; // eslint-disable-line
import '../../css/views/searchv1.scss';
/*
searchv1.js is included in assembl/templates/index.jinja2
(you need to change the url for production)
The search div is included in the page from assembl/templates/views/navBar.tmpl
and the Search react component is rendered via the onDomRefresh event in
assembl/static/js/app/views/navBar.js
*/


const myCreateStore = () => {
  const store = createStore(RootReducer, applyMiddleware(Thunk));
  const assemblLocale = window.assembl_locale.split('_')[0];
  const userLocale = GlobalFunctions.getLocale(assemblLocale);
  syncTranslationWithStore(store);
  store.dispatch(loadTranslations(Translations));
  store.dispatch(setLocale(userLocale));
  return store;
};


class SearchApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isExpert: false };
  }
  componentWillMount() {
    const discussionId = GlobalFunctions.getDiscussionId();
    const connectedUserId = GlobalFunctions.getConnectedUserId();
    this.discussionId = discussionId;
    this.connectedUserId = connectedUserId;
    if (connectedUserId) {
      fetchPermissionsForUser(discussionId, connectedUserId).then((permissions) => {
        const isExpert = canUseExpertInterface(permissions);
        if (isExpert) {
          this.setState({ isExpert: true });
        }
      });
    }
  }

  render() {
    return (
      <SearchComponent
        isExpert={this.state.isExpert}
        connectedUserId={this.connectedUserId}
        discussionId={this.discussionId}
      />
    );
  }
}


const store = myCreateStore();
const renderSearch = () => {
  ReactDOM.render(
    <Provider store={store}>
      <SearchApp />
    </Provider>,
    document.getElementById('search')
  );
};
global.renderSearch = renderSearch;