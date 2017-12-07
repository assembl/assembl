const fs = require('fs');
const translations = require('../js/app/utils/translations');
const flattenDeep = require('lodash/flattenDeep');

const englishTranslations = translations.en;

const nestedObjects2nestedMessages = (objOrString, fullkey = '') => {
  if (typeof objOrString === 'string') {
    return {
      id: fullkey,
      defaultMessage: objOrString
    };
  }
  return Object.keys(objOrString).map((key) => {
    const newfullkey = fullkey ? `${fullkey}.${key}` : key;
    return nestedObjects2nestedMessages(objOrString[key], newfullkey);
  });
};

const nestedObjects2messages = (objOrString, fullkey = '') => flattenDeep(nestedObjects2nestedMessages(objOrString, fullkey));

const messages = flattenDeep(nestedObjects2messages(englishTranslations));

const wstream = fs.createWriteStream('./messages.json');
wstream.write(JSON.stringify(messages, null, 2));

module.exports = nestedObjects2messages;