// @flow
import { I18n } from 'react-redux-i18n';

import { langstringIsEmpty } from '../survey/validate';
import type { ResourcesValues } from './types.flow';

function validateResource(resource) {
  const errors = {};
  if (langstringIsEmpty(resource.title)) {
    errors.title = I18n.t('error.required');
  }

  return errors;
}

export default function validate(values: ResourcesValues) {
  // FIXME: pageTitle validation doesn't work
  return {
    pageTitle: langstringIsEmpty(values.pageTitle) ? I18n.t('error.required') : '',
    resources: values.resources.map(validateResource)
  };
}