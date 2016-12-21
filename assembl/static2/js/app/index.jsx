import React from 'react';
import ReactDOM from 'react-dom';
import Thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { loadTranslations, setLocale, syncTranslationWithStore } from 'react-redux-i18n';
import 'bootstrap/dist/css/bootstrap.css';
import '../../css/main.scss';
import Context from './utils/context';
import LangString from './utils/langString';
import RootReducer from './reducers/rootReducer';
import Debate from './components/debateComponent';

const userLang = Context.getBrowserLanguage();
const store = createStore(RootReducer, applyMiddleware(Thunk));
syncTranslationWithStore(store);
store.dispatch(loadTranslations(LangString));
store.dispatch(setLocale(userLang));

ReactDOM.render(
  <Debate />,
  document.getElementById('root')
);