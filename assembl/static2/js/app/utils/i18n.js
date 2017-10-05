import { I18n } from 'react-redux-i18n';

import deepen from './deepen';
import Translations from './translations';
import ja from '../../../translations/ja.json';
import zhCN from '../../../translations/zh_CN.json';

Translations.ja = deepen(ja);
Translations.zh_CN = deepen(zhCN);

const fallbackLocale = 'en';
const myHandleMissingTranslation = function (key, replacements) {
  // We need to use a function, not a arrow function here to be able to use 'this'.
  let translation = '';
  try {
    translation = this._fetchTranslation(this._translations, `${fallbackLocale}.${key}`, replacements.count); // eslint-disable-line
  } catch (err) {
    return `Missing translation: ${key}`;
  }
  return this._replace(translation, replacements); // eslint-disable-line
};
I18n.setHandleMissingTranslation(myHandleMissingTranslation);

export const getTranslations = () => {
  return Translations;
};

export const getLocale = (browserLanguage) => {
  let locale;
  if (browserLanguage === 'zh' || browserLanguage === 'zh-CN') {
    locale = 'zh_CN';
  } else {
    locale = browserLanguage.split('-')[0].toLowerCase();
  }
  if (!Translations[locale]) {
    locale = 'en';
  }
  return locale;
};

export const getAvailableLocales = (locale, translations) => {
  const locArray = [];
  Object.keys(translations).map((key) => {
    if (key !== locale) locArray.push(key);
    return locArray;
  });
  return locArray;
};