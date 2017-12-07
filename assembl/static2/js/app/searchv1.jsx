import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import Thunk from 'redux-thunk';
import { loadTranslations, setLocale, syncTranslationWithStore } from 'react-redux-i18n';
import rootReducer from './reducers/rootReducer';
import { getDiscussionId, getConnectedUserId } from './utils/globalFunctions';
import { getLocale, getTranslations } from './utils/i18n';
import { connectedUserIsExpert } from './utils/permissions';

import { SearchComponent } from './components/search.jsx?v=1'; // eslint-disable-line

// Keep the style import here. The reason why it's not in main.scss is because
// we create a searchv1 bundle that includes only the Search component and its
// local styles for v1. There is an additional searchv1.scss file that overrides
// some styles for v1
import '../../css/views/searchv1.scss';
/*
searchv1.js is included in assembl/templates/index.jinja2
The search div is included in the page from assembl/templates/views/navBar.tmpl
and the Search react component is rendered via the onDomRefresh event in
assembl/static/js/app/views/navBar.js
*/

const myCreateStore = () => {
  const store = createStore(rootReducer, applyMiddleware(Thunk));
  const assemblLocale = window.assembl_locale.split('_')[0];
  const userLocale = getLocale(assemblLocale);
  syncTranslationWithStore(store);
  store.dispatch(loadTranslations(getTranslations()));
  store.dispatch(setLocale(userLocale));
  return store;
};

class SearchApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isExpert: false };
  }

  componentWillMount() {
    const discussionId = getDiscussionId();
    const connectedUserId = getConnectedUserId();
    this.discussionId = discussionId;
    this.connectedUserId = connectedUserId;
    if (connectedUserId) {
      const isExpert = connectedUserIsExpert();
      if (isExpert) {
        this.setState({ isExpert: true });
      }
    }
  }

  render() {
    return (
      <SearchComponent isExpert={this.state.isExpert} connectedUserId={this.connectedUserId} discussionId={this.discussionId} />
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