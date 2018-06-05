// @flow
import * as actionTypes from '../actionTypes';

export const updateLegalNoticeEntry = (locale: string, value: string): actionTypes.UpdateLegalNoticeEntry => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_LEGAL_NOTICE_ENTRY
});

export const updateTermsAndConditionsEntry = (locale: string, value: string): actionTypes.UpdateTermsAndConditionsEntry => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_TERMS_AND_CONDITIONS_ENTRY
});


export const updateCookiesPolicyEntry = (locale: string, value: string): actionTypes.UpdateCookiesPolicyEntry => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_COOKIES_POLICY_ENTRY
});

export const updatePrivacyPolicyEntry = (locale: string, value: string): actionTypes.UpdatePrivacyPolicyEntry => ({
  locale: locale,
  value: value,
  type: actionTypes.UPDATE_PRIVACY_POLICY_ENTRY
});

type LegalContentsValue = {
  cookiesPolicyEntries: Array<LangStringEntryInput>,
  privacyPolicyEntries: Array<LangStringEntryInput>,
  legalNoticeEntries: Array<LangStringEntryInput>,
  termsAndConditionsEntries: Array<LangStringEntryInput>
}

export const updateLegalContents = (value: LegalContentsValue): actionTypes.UpdateLegalContents => ({
  legalNoticeEntries: value.legalNoticeEntries,
  termsAndConditionsEntries: value.termsAndConditionsEntries,
  cookiesPolicyEntries: value.cookiesPolicyEntries,
  privacyPolicyEntries: value.privacyPolicyEntries,
  type: actionTypes.UPDATE_LEGAL_CONTENTS
});