import { I18n } from 'react-redux-i18n';

import { getTranslations } from '../../js/app/utils/i18n';

const myHandleMissingTranslation = function (key, replacements) {
  // We need to use a function, not a arrow function here to be able to use 'this' which is the I18n react-i18nify object.
  let translation = '';
  try {
    translation = this._fetchTranslation(getTranslations(), `en.${key}`, replacements.count); // eslint-disable-line no-underscore-dangle, max-len
  } catch (err) {
    return `Missing translation: ${key}`;
  }
  return this._replace(translation, replacements); // eslint-disable-line no-underscore-dangle
};
I18n.setHandleMissingTranslation(myHandleMissingTranslation);