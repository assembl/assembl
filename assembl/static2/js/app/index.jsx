import React from 'react';
import ReactDOM from 'react-dom';
import { Router, browserHistory } from 'react-router';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.css';
import '../../css/main.scss';
import Store from './store/store';
import Routes from './routes';

const store = Store.createStore();

ReactDOM.render(
  <Provider store={store}>
    <Router history={browserHistory} routes={Routes} />
  </Provider>,
  document.getElementById('root')
);