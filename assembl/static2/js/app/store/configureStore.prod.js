import { createStore, applyMiddleware, compose } from 'redux';

export default function configureStore(initialState, rootReducer, middlewares) {
  return createStore(rootReducer, initialState, compose(applyMiddleware(...middlewares)));
}