import Translations from './translations';

class GlobalFunctions {
  static getLocale(browserLanguage) {
    let locale = browserLanguage.split('-')[0].toLowerCase();
    if (!Translations[locale]) locale = 'en';
    return locale;
  }
  static getDiscussionId() {
    const discussionId = document.getElementById('discussion-id').value;
    return discussionId;
  }
}

export default GlobalFunctions;