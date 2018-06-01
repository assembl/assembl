// @flow
import type ReduxAction from 'redux';
import { fromJS, List, Map } from 'immutable';

import {
  type Action,
  UPDATE_LEGAL_NOTICE_ENTRY,
  UPDATE_TERMS_AND_CONDITIONS_ENTRY,
  UPDATE_COOKIES_POLICY_ENTRY,
  UPDATE_PRIVACY_POLICY_ENTRY,
  UPDATE_LEGAL_CONTENTS
} from '../../actions/actionTypes';
import { updateInLangstringEntries } from '../../utils/i18n';

const initialState = Map({
  _hasChanged: false,
  legalNoticeEntries: List(),
  termsAndConditionsEntries: List(),
  cookiesPolicyEntries: List(),
  privacyPolicyEntries: List()
});

export type LegalContentsReducer = (Map, ReduxAction<Action>) => Map;
const legalContents: LegalContentsReducer = (state = initialState, action) => {
  switch (action.type) {
  case UPDATE_LEGAL_NOTICE_ENTRY:
    return state
      .update('legalNoticeEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('_hasChanged', true);
  case UPDATE_TERMS_AND_CONDITIONS_ENTRY:
    return state
      .update('termsAndConditionsEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('_hasChanged', true);
  case UPDATE_COOKIES_POLICY_ENTRY:
    return state
      .update('cookiesPolicyEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('_hasChanged, true');
  case UPDATE_PRIVACY_POLICY_ENTRY:
    return state
      .update('privacyPolicyEntries', updateInLangstringEntries(action.locale, fromJS(action.value)))
      .set('_hasChanged, true');
  case UPDATE_LEGAL_CONTENTS:
    return Map({
      _hasChanged: false,
      legalNoticeEntries: fromJS(action.legalNoticeEntries),
      termsAndConditionsEntries: fromJS(action.termsAndConditionsEntries),
      cookiesPolicyEntries: fromJS(action.cookiesPolicyEntries),
      privacyPolicyEntries: fromJS(action.privacyPolicyEntries)
    });
  default:
    return state;
  }
};

export type LegalContentsState = {
  _hasChanged: boolean,
  legalNoticeEntries: List<LangstringEntry>,
  termsAndConditionsEntries: List<LangstringEntry>,
  cookiesPolicyEntries: List<LangstringEntry>,
  privacyPolicyEntries: List<LangstringEntry>
};

export default legalContents;