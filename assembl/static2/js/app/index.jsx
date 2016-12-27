import React from 'react';
import ReactDOM from 'react-dom';
import { Router, browserHistory } from 'react-router';
import { Provider } from 'react-redux';
import Thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { loadTranslations, setLocale, syncTranslationWithStore } from 'react-redux-i18n';
import 'bootstrap/dist/css/bootstrap.css';
import '../../css/main.scss';
import Routes from './routes';
import GlobalFunctions from './utils/globalFunctions';
import Translations from './utils/translations';
import RootReducer from './reducers/rootReducer';

const store = createStore(RootReducer, applyMiddleware(Thunk));
const browserLanguage = navigator.language || navigator.userLanguage;
const userLocale = GlobalFunctions.getLocale(browserLanguage);
syncTranslationWithStore(store);
store.dispatch(loadTranslations(Translations));
store.dispatch(setLocale(userLocale));

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory} routes={Routes} />
  </Provider>,
  document.getElementById('root')
);