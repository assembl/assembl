import Translations from './translations';

class GlobalFunctions {
  static getLocale(browserLanguage) {
    let locale = browserLanguage.split('-')[0].toLowerCase();
    if (!Translations[locale]) locale = 'en';
    return locale;
  }
  static getAvalaibleLocales(locale, translations) {
    const locArray = [];
    Object.keys(translations).map((key) => {
      if (key !== locale) locArray.push(key);
      return locArray;
    });
    return locArray;
  }
  static getDiscussionId() {
    const discussionId = document.getElementById('discussion-id') ? document.getElementById('discussion-id').value : null;
    return discussionId;
  }
  static getConnectedUserId() {
    const userId = document.getElementById('user-id') ? document.getElementById('user-id').value : null;
    return userId;
  }
  static getSortedDate(object, key) {
    const sortedDate = object.map((item) => {
      const date = item[key];
      return new Date(date).getTime();
    }).sort();
    return sortedDate;
  }
  static compareDates(date1, date2) {
    return date1 > date2;
  }
  static getNumberOfDays(date1, date2) {
    const days = (date1 - date2) / (1000 * 60 * 60 * 24);
    return Math.round(days);
  }
  static calculatePercentage(value1, value2) {
    return (value1 * 100) / value2;
  }
  static getCustomDate(str) {
    let date = new Date(str);
    date.setHours(date.getHours() + (date.getTimezoneOffset() / 60));
    return date;
  }
}

export default GlobalFunctions;