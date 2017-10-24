import { I18n } from 'react-redux-i18n';
import { multiColumnMapping } from '../../../utils/mapping';

export const orderPostsByMessageClassifier = (messageColumns, posts) => {
  return messageColumns.reduce((naziLinter, col) => {
    const keyName = col.messageClassifier;
    const columnsMap = naziLinter;
    columnsMap[keyName] = posts.filter((post) => {
      return post.messageClassifier === keyName;
    });
    return columnsMap;
  }, {});
};

export const getSynthesisTitle = (classifier, colName, ideaTitle) => {
  const mapping = multiColumnMapping(ideaTitle).columnsView;
  return mapping[classifier] || I18n.t('multiColumns.synthesis.colName', { colName: colName });
};