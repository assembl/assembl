/* eslint-disable */
// @flow
import { I18n } from 'react-redux-i18n';
import { List, Map } from 'immutable';

import deepen from './deepen';
import Translations from './translations';
import de from '../../../translations/de.json';
import es from '../../../translations/es.json';
import hu from '../../../translations/hu.json';
import it from '../../../translations/it.json';
import ja from '../../../translations/ja.json';
import nb from '../../../translations/nb.json';
import nl from '../../../translations/nl.json';
import pl from '../../../translations/pl.json';
import pt from '../../../translations/pt.json';
import ro from '../../../translations/ro.json';
import ru from '../../../translations/ru.json';
import th from '../../../translations/th.json';
import tr from '../../../translations/tr.json';
import zhCN from '../../../translations/zh_CN.json';

Translations.de = deepen(de);
Translations.es = deepen(es);
Translations.hu = deepen(hu);
Translations.it = deepen(it);
Translations.ja = deepen(ja);
Translations.nb = deepen(nb);
Translations.nl = deepen(nl);
Translations.pl = deepen(pl);
Translations.pt = deepen(pt);
Translations.ro = deepen(ro);
Translations.ru = deepen(ru);
Translations.ru = deepen(ru);
Translations.th = deepen(th);
Translations.tr = deepen(tr);
Translations['zh-CN'] = deepen(zhCN);

const fallbackLocale = 'en';
const myHandleMissingTranslation = function(key, replacements) {
  // We need to use a function, not a arrow function here to be able to use 'this' which is the I18n react-i18nify object.
  let translation = '';
  try {
    translation = this._fetchTranslation(this._translations, `${fallbackLocale}.${key}`, replacements.count); // eslint-disable-line no-underscore-dangle, max-len
  } catch (err) {
    return `Missing translation: ${key}`;
  }
  return this._replace(translation, replacements); // eslint-disable-line no-underscore-dangle
};
I18n.setHandleMissingTranslation(myHandleMissingTranslation);

export const getTranslations = () => Translations;

export const getLocale = (browserLanguage: string): string => {
  let locale;
  console.log('browserLanguage', browserLanguage);
  if (browserLanguage === 'zh' || browserLanguage === 'zh-CN') {
    locale = 'zh-CN';
  } else {
    locale = browserLanguage.split('-')[0].toLowerCase();
  }
  console.log('locale', locale);
  if (!Translations[locale]) {
    locale = 'en';
  }
  return locale;
};

export const getAvailableLocales = (locale: string, translations: { [string]: any }): Array<string> => {
  const locArray = [];
  Object.keys(translations).map(key => {
    if (key !== locale) locArray.push(key);
    return locArray;
  });
  return locArray;
};

/*
  @function updateInLangstringEntries
  @param {string} locale - the locale of the langstring entry that we want to edit
  @param {string} value - the value that will be set

  @example
    // will change the french value by 'foobar' in titleEntries
    const state = Map({
      titleEntries: [
        {localeCode: 'fr', value: 'Mon titre'},
        {localeCode: 'en', value: 'My title'}
      ]
    })
    state.update(
      'titleEntries',
      updateInLangstringEntries('fr', 'foobar')
    );

    @returns {function} Updater function (see immutable-js) that updates the value of the
    entry with given locale by the given value
*/
// EditorState in case of rich text
type LangstringValue = string | EditorState;
export type LangstringEntriesList = List<Map<string, LangstringValue>>;
export const updateInLangstringEntries = (locale: string, value: LangstringValue) => (
  entries: LangstringEntriesList = List()
): LangstringEntriesList => {
  const entryIndex = entries.findIndex(entry => entry.get('localeCode') === locale);

  if (entryIndex === -1) {
    return entries.push(Map({ localeCode: locale, value: value }));
  }

  return entries.setIn([entryIndex, 'value'], value);
};

export const getEntryValueForLocale = (
  entries: LangstringEntriesList,
  locale: string,
  defaultValue: ?LangstringValue = null
): ?LangstringValue => {
  if (!entries) {
    return defaultValue;
  }

  const entry = entries.find(e => e.get('localeCode') === locale);

  return entry ? entry.get('value') : defaultValue;
};

export const convertToLangstringEntries = (s: string, localeCode: string): LangstringEntries => [
  { localeCode: localeCode, value: s }
];
