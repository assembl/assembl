const fs = require('fs');
const translations = require('../js/app/utils/translations');

const englishTranslations = translations.en;

function flatten(arr) {
  return arr.reduce((flat, toFlatten) => {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

const object2messages = (fullkey, objOrString) => {
  if (typeof objOrString === 'string') {
    return {
      id: fullkey,
      defaultMessage: objOrString
    };
  }
  return Object.keys(objOrString).map((key) => {
    const newfullkey = fullkey ? `${fullkey}.${key}` : key;
    return object2messages(newfullkey, objOrString[key]);
  });
};

const messages = flatten(object2messages('', englishTranslations));

const wstream = fs.createWriteStream('./messages.json');
wstream.write(JSON.stringify(messages, null, 2));