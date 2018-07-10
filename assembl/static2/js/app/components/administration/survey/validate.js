import { I18n } from 'react-redux-i18n';

function langstringIsEmpty(ls) {
  return !ls || Object.values(ls).every(s => s.length === 0);
}

function validateVideo(video) {
  const errors = {};
  if (video.present && langstringIsEmpty(video.title)) {
    errors.title = I18n.t('error.required');
  }

  return errors;
}

function validateTheme(theme) {
  const errors = {};
  if (langstringIsEmpty(theme.title)) {
    errors.title = I18n.t('error.required');
  }

  if (theme.video) {
    errors.video = validateVideo(theme.video);
  }

  return errors;
}

export default function validate(values) {
  const themes = values.themes.map(validateTheme);
  return {
    themes: themes
  };
}