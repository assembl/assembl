import { I18n } from 'react-redux-i18n';

export default function validate(values) {
  const errors = {};
  if (!values.title) {
    errors.title = I18n.t('error.required');
  }

  if (!values.favicon) {
    errors.favicon = I18n.t('error.required');
  }

  return errors;
}