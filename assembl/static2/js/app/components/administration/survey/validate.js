import { I18n } from 'react-redux-i18n';

import { i18nValueIsEmpty } from '../../form/utils';

function validateVideo(video) {
  const errors = {};
  if (video.present && i18nValueIsEmpty(video.title)) {
    errors.title = I18n.t('error.required');
  }

  return errors;
}

function validateTheme(theme) {
  const errors = {};
  if (i18nValueIsEmpty(theme.title)) {
    errors.title = I18n.t('error.required');
  }

  if (theme.video) {
    errors.video = validateVideo(theme.video);
  }

  if (theme.children) {
    errors.children = theme.children.map(validateTheme);
  }
  return errors;
}

export default function validate(values) {
  const themes = values.themes.map(validateTheme);
  return {
    themes: themes
  };
}