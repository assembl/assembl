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

export const updateLegalNoticeAndTerms = (value: Object): actionTypes.UpdateLegalNoticeAndTerms => ({
  legalNoticeEntries: value.legalNoticeEntries,
  termsAndConditionsEntries: value.termsAndConditionsEntries,
  type: actionTypes.UPDATE_LEGAL_NOTICE_AND_TERMS
});