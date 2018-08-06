// @flow
import { I18n } from 'react-redux-i18n';

import { i18nValueIsEmpty } from '../../form/utils';
import type { ResourcesValues } from './types.flow';

function validateResource(resource) {
  const errors = {};
  if (i18nValueIsEmpty(resource.title)) {
    errors.title = I18n.t('error.required');
  }

  return errors;
}

export default function validate(values: ResourcesValues) {
  return {
    pageTitle: i18nValueIsEmpty(values.pageTitle) ? I18n.t('error.required') : undefined,
    resources: values.resources.map(validateResource)
  };
}