// @flow
import { I18n } from 'react-redux-i18n';

import { i18nValueIsEmpty } from '../../form/utils';
import type { ThemesAdminValues } from './types.flow';
import { MESSAGE_VIEW } from '../../../constants';

type Errors = {
  title?: string,
  children?: Array<Errors>
};

type Values = ThemesAdminValues;

function validateTheme(theme): Errors {
  const errors = {};
  if (i18nValueIsEmpty(theme.title)) {
    errors.title = I18n.t('error.required');
  }

  errors.announcement = {};
  if (theme.messageViewOverride && theme.messageViewOverride.value !== MESSAGE_VIEW.noModule) {
    if (!theme.announcement) {
      errors.announcement = I18n.t('error.required');
    } else if (i18nValueIsEmpty(theme.announcement.title)) {
      errors.announcement.title = I18n.t('error.required');
    }
  }

  if (theme.children) {
    errors.children = theme.children.map(validateTheme);
  }
  return errors;
}

export default function validate(values: Values): { themes: Array<Errors> } {
  const themes = values.themes.map(validateTheme);
  return {
    themes: themes
  };
}