// @flow
import * as actionTypes from '../actionTypes';

export const updateLegalNoticeEntry = (locale: string, value: string): actionTypes.UpdateLegalNoticeEntry => {
  return { locale: locale, value: value, type: actionTypes.UPDATE_LEGAL_NOTICE_ENTRY };
};

export const updateTermsAndConditionsEntry = (locale: string, value: string): actionTypes.UpdateTermsAndConditionsEntry => {
  return { locale: locale, value: value, type: actionTypes.UPDATE_TERMS_AND_CONDITIONS_ENTRY };
};

export const updateLegalNoticeAndTerms = (value: Object): actionTypes.UpdateLegalNoticeAndTerms => {
  return {
    legalNoticeEntries: value.legalNoticeEntries,
    termsAndConditionsEntries: value.termsAndConditionsEntries,
    type: actionTypes.UPDATE_LEGAL_NOTICE_AND_TERMS
  };
};