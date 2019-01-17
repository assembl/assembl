// @flow
import type { I18nRichTextValue } from '../../form/types.flow';

export type LegalContentsFormValues = {
  legalNotice: I18nRichTextValue,
  termsAndConditions: I18nRichTextValue,
  cookiesPolicy: I18nRichTextValue,
  privacyPolicy: I18nRichTextValue,
  userGuidelines: I18nRichTextValue,
  mandatoryLegalContentsValidation: boolean
};