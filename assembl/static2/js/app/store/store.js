import { createStore, applyMiddleware } from 'redux';
import Thunk from 'redux-thunk';
import { loadTranslations, setLocale, syncTranslationWithStore } from 'react-redux-i18n';
import RootReducer from '../reducers/rootReducer';
import GlobalFunctions from '../utils/globalFunctions';
import Translations from '../utils/translations';

class Store {
  static createStore() {
    const store = createStore(RootReducer, applyMiddleware(Thunk));
    const browserLanguage = navigator.language || navigator.userLanguage;
    const isStoragedlocale = localStorage.getItem('locale') !== null;
    const userLocale = isStoragedlocale ? localStorage.getItem('locale') : GlobalFunctions.getLocale(browserLanguage);
    syncTranslationWithStore(store);
    store.dispatch(loadTranslations(Translations));
    store.dispatch(setLocale(userLocale));

    return store;
  }
}

export default Store;