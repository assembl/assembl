// @flow
import type { FileValue, I18nValue } from '../../form/types.flow';

export type LegalContentsFormValues = {
  legalNotice: I18nValue,
  termsAndConditions: I18nValue,
  cookiesPolicy: I18nValue,
  privacyPolicy: I18nValue,
  userGuidelines: I18nValue
};