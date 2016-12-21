import LangString from './langString';

class Context {
  static getLocale(browserLanguage) {
    let locale = browserLanguage.split('-')[0].toLowerCase();
    if (!LangString[locale]) locale = 'en';
    return locale;
  }
}

export default Context;