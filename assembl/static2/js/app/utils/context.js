import LangString from './langString';

class Context {
  static getBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    let userLang = browserLang.split('-')[0].toLowerCase();
    if (!LangString[userLang]) userLang = 'en';
    return userLang;
  }
}

export default Context;