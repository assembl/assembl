// @flow
import { I18n } from 'react-redux-i18n';
import { i18nValueIsEmpty } from '../../form/utils';
import type { BrightMirrorAdminValues } from './types.flow';

function validateTheme(thematic) {
  const errors = {};
  errors.announcement = {};
  if (i18nValueIsEmpty(thematic.title)) {
    errors.title = I18n.t('error.required');
  }
  if (!thematic.img) {
    errors.img = I18n.t('error.required');
  }
  if (!thematic.announcement) {
    errors.announcement = I18n.t('error.required');
  } else if (i18nValueIsEmpty(thematic.announcement.title)) {
    errors.announcement.title = I18n.t('error.required');
  }
  return errors;
}

export default function validate(values: BrightMirrorAdminValues) {
  const themes = values.themes.map(validateTheme);
  return {
    themes: themes
  };
}