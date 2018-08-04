import { I18n } from 'react-redux-i18n';

const ICON_MIMETYPE = ['image/vnd.microsoft.icon', 'image/x-icon'];

function validateFavicon(favicon) {
  if (!favicon) return I18n.t('error.required');
  if (favicon && !ICON_MIMETYPE.includes(favicon.mimeType)) {
    return I18n.t('administration.personnaliseInterface.icoRequired');
  }

  return null;
}

export default function validate(values) {
  const errors = {};
  if (!values.title) {
    errors.title = I18n.t('error.required');
  }
  const faviconErrors = validateFavicon(values.favicon);
  if (faviconErrors) {
    errors.favicon = faviconErrors;
  }

  return errors;
}