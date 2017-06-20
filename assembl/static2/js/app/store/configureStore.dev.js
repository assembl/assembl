import { createStore, applyMiddleware, compose } from 'redux';

export default function configureStore(initialState, rootReducer, middlewares) {
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose; // eslint-disable-line no-underscore-dangle
  const store = createStore(rootReducer, initialState, composeEnhancers(applyMiddleware(...middlewares)));
  return store;
}