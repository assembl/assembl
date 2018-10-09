// @flow
import { I18n } from 'react-redux-i18n';

import type { StrictFile } from '../../../form/types.flow';
import type { PersonalizeInterfaceValues } from './types.flow';

const ICON_MIMETYPE = ['image/vnd.microsoft.icon', 'image/x-icon'];

type Errors = {
  title?: string,
  favicon?: string
};

type Values = {
  favicon: ?StrictFile
} & PersonalizeInterfaceValues;

function validateFavicon(favicon: ?StrictFile): string | null {
  if (favicon && !ICON_MIMETYPE.includes(favicon.mimeType)) {
    return I18n.t('administration.personalizeInterface.icoRequired');
  }

  return null;
}

export default function validate(values: Values): Errors {
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