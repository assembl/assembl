// @flow
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';

import {
  type Action,
  UPDATE_LEGAL_NOTICE_ENTRY,
  UPDATE_TERMS_AND_CONDITIONS_ENTRY,
  UPDATE_LEGAL_NOTICE_AND_TERMS
} from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

const initialState = Map({
  hasChanged: false,
  legalNoticeEntries: List(),
  termsAndConditionsEntries: List()
});

export type LegalNoticeAndTermsReducer = (Map, ReduxAction<Action>) => Map;
const legalNoticeAndTerms: LegalNoticeAndTermsReducer = (state = initialState, action) => {
  switch (action.type) {
  case UPDATE_LEGAL_NOTICE_ENTRY:
    return state
      .update('legalNoticeEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_TERMS_AND_CONDITIONS_ENTRY:
    return state
      .update('termsAndConditionsEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('hasChanged', true);
  case UPDATE_LEGAL_NOTICE_AND_TERMS:
    return Map({
      hasChanged: false,
      legalNoticeEntries: fromJS(action.legalNoticeEntries),
      termsAndConditionsEntries: fromJS(action.termsAndConditionsEntries)
    });
  default:
    return state;
  }
};

export type LegalNoticeAndTermsState = {
  hasChanged: boolean,
  legalNoticeEntries: List<LangstringEntry>,
  termsAndConditionsEntries: List<LangstringEntry>
};

export default legalNoticeAndTerms;