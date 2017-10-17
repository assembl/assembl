import { I18n } from 'react-redux-i18n';

export const multiColumnMapping = (ideaTitle) => {
  return {
    announcement: {
      positive: I18n.t('multiColumns.announcement.positiveTitle'),
      negative: I18n.t('multiColumns.announcement.negativeTitle'),
      alternative: I18n.t('multiColumns.announcement.alternativeTitle')
    },
    columnsView: {
      positive: I18n.t('multiColumns.synthesis.positiveTitle', { ideaTitle: ideaTitle }),
      negative: I18n.t('multiColumns.synthesis.negativeTitle', { ideaTitle: ideaTitle }),
      alternative: I18n.t('multiColumns.synthesis.alternativeTitle', { ideaTitle: ideaTitle })
    }
  };
};