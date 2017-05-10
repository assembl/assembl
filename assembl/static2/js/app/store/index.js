import { loadTranslations, setLocale, syncTranslationWithStore } from 'react-redux-i18n';

import configureStore from './configureStore';
import middlewares from './middlewares';
import rootReducer from '../reducers/rootReducer';
import { getLocale } from '../utils/globalFunctions';
import Translations from '../utils/translations';

export default function createAppStore(initialState) {
  const store = configureStore(initialState, rootReducer, middlewares);
  if (module.hot) {
    module.hot.accept('../reducers/rootReducer', () => {
      const nextRootReducer = require('../reducers/rootReducer').default;  // eslint-disable-line
      store.replaceReducer(nextRootReducer);
    });
  }
  const browserLanguage = navigator.language || navigator.userLanguage;
  const isStoragedlocale = localStorage.getItem('locale') !== null;
  const userLocale = isStoragedlocale ? localStorage.getItem('locale') : getLocale(browserLanguage);
  syncTranslationWithStore(store);
  store.dispatch(loadTranslations(Translations));
  store.dispatch(setLocale(userLocale));
  return store;
}