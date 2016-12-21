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
import Context from './utils/context';
import LangString from './utils/langString';
import RootReducer from './reducers/rootReducer';

const store = createStore(RootReducer, applyMiddleware(Thunk));
const browserLanguage = navigator.language || navigator.userLanguage;
const userLocale = Context.getLocale(browserLanguage);
syncTranslationWithStore(store);
store.dispatch(loadTranslations(LangString));
store.dispatch(setLocale(userLocale));

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory} routes={Routes} />
  </Provider>,
  document.getElementById('root')
);