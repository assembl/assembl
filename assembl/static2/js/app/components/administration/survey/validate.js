// @flow
import { I18n } from 'react-redux-i18n';

import { i18nValueIsEmpty } from '../../form/utils';
import type { ThemesAdminValues } from './types.flow';
import { MESSAGE_VIEW } from '../../../constants';

type Errors = {
  title?: string,
  children?: Array<Errors>
};

function validateTheme(theme): Errors {
  const errors = {};
  if (i18nValueIsEmpty(theme.title)) {
    errors.title = I18n.t('error.required');
  }

  if (theme.messageViewOverride && theme.messageViewOverride.value !== MESSAGE_VIEW.noModule) {
    errors.announcement = {};
    if (!theme.announcement || i18nValueIsEmpty(theme.announcement.title)) {
      errors.announcement.title = I18n.t('error.required');
    }
  }

  if (theme.messageViewOverride && theme.messageViewOverride.value === MESSAGE_VIEW.messageColumns) {
    if (theme.multiColumns && theme.multiColumns.messageColumns) {
      errors.multiColumns = {
        messageColumns: []
      };
      theme.multiColumns.messageColumns.forEach((col, index) => {
        errors.multiColumns.messageColumns.push({});
        if (i18nValueIsEmpty(col.title)) {
          errors.multiColumns.messageColumns[index].title = I18n.t('error.required');
        }
        if (i18nValueIsEmpty(col.name)) {
          errors.multiColumns.messageColumns[index].name = I18n.t('error.required');
        }
      });
    }
  }

  if (theme.children) {
    errors.children = theme.children.map(validateTheme);
  }

  return errors;
}

export default function validate(values: ThemesAdminValues): { themes: Array<Errors> } {
  const themes = values.themes.map(validateTheme);
  return {
    themes: themes
  };
}