// @flow
import { I18n } from 'react-redux-i18n';
import { i18nValueIsEmpty } from '../../form/utils';
import type { LegalContentsFormValues } from './types.flow';

const validate = (values: LegalContentsFormValues) => ({
  legalNotice: i18nValueIsEmpty(values.legalNotice) ? I18n.t('error.required') : undefined,
  termsAndConditions: i18nValueIsEmpty(values.termsAndConditions) ? I18n.t('error.required') : undefined,
  cookiesPolicy: i18nValueIsEmpty(values.cookiesPolicy) ? I18n.t('error.required') : undefined,
  privacyPolicy: i18nValueIsEmpty(values.privacyPolicy) ? I18n.t('error.required') : undefined,
  userGuidelines: i18nValueIsEmpty(values.userGuidelines) ? I18n.t('error.required') : undefined
});

export default validate;