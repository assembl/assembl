import { createStore, applyMiddleware, compose } from 'redux';

export default function configureStore(initialState, rootReducer, middlewares) {
  const store = createStore(rootReducer, initialState, compose(applyMiddleware(...middlewares), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())); // eslint-disable-line no-underscore-dangle
  return store;
}