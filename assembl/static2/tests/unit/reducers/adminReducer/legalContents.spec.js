import { List, Map } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes';
import legalContents from '../../../../js/app/reducers/adminReducer/legalContents';

describe('legalContents admin reducer', () => {
  it('it should return the initial state', () => {
    const action = {};
    const expected = Map({
      _hasChanged: false,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List(),
      cookiesPolicyEntries: List(),
      privacyPolicyEntries: List()
    });
    expect(legalContents(undefined, action)).toEqual(expected);
  });

  it('should return the current state for other actions', () => {
    const action = { type: 'FOOBAR' };
    const oldState = Map();
    expect(legalContents(oldState, action)).toEqual(oldState);
  });

  it('should handle UPDATE_TERMS_AND_CONDITIONS_ENTRY action type', () => {
    const action = {
      type: actionTypes.UPDATE_TERMS_AND_CONDITIONS_ENTRY,
      locale: 'en',
      value: 'foobar'
    };
    const oldState = Map({
      _hasChanged: false,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List.of(Map({ localeCode: 'en', value: 'my terms and conditions' })),
      cookiesPolicyEntries: List(),
      privacyPolicyEntries: List()
    });
    const expected = Map({
      _hasChanged: true,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List.of(Map({ localeCode: 'en', value: 'foobar' })),
      cookiesPolicyEntries: List(),
      privacyPolicyEntries: List()
    });
    expect(legalContents(oldState, action)).toEqual(expected);
  });

  it('should handle UPDATE_LEGAL_NOTICE_ENTRY action type', () => {
    const action = {
      type: actionTypes.UPDATE_LEGAL_NOTICE_ENTRY,
      locale: 'en',
      value: 'foobar'
    };
    const oldState = Map({
      _hasChanged: false,
      legalNoticeEntries: List.of(Map({ localeCode: 'en', value: 'my legal notice' })),
      termsAndConditionsEntries: List(),
      cookiesPolicyEntries: List(),
      privacyPolicyEntries: List()
    });
    const expected = Map({
      _hasChanged: true,
      legalNoticeEntries: List.of(Map({ localeCode: 'en', value: 'foobar' })),
      termsAndConditionsEntries: List(),
      cookiesPolicyEntries: List(),
      privacyPolicyEntries: List()
    });
    expect(legalContents(oldState, action)).toEqual(expected);
  });

  it('should handle UPDATE_COOKIES_POLICY_ENTRY action type', () => {
    const action = {
      type: actionTypes.UPDATE_COOKIES_POLICY_ENTRY,
      locale: 'en',
      value: 'foobar'
    };
    const oldState = Map({
      _hasChanged: false,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List(),
      cookiesPolicyEntries: List.of(Map({ localeCode: 'en', value: 'my cookies policy' })),
      privacyPolicyEntries: List()
    });
    const expected = Map({
      _hasChanged: true,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List(),
      cookiesPolicyEntries: List.of(Map({ localeCode: 'en', value: 'foobar' })),
      privacyPolicyEntries: List()
    });
    expect(legalContents(oldState, action)).toEqual(expected);
  });

  it('should handle UPDATE_PRIVACY_POLICY_ENTRY action type', () => {
    const action = {
      type: actionTypes.UPDATE_PRIVACY_POLICY_ENTRY,
      locale: 'en',
      value: 'foobar'
    };
    const oldState = Map({
      _hasChanged: false,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List(),
      cookiesPolicyEntries: List(),
      privacyPolicyEntries: List.of(Map({ localeCode: 'en', value: 'my legal notice' }))
    });
    const expected = Map({
      _hasChanged: true,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List(),
      cookiesPolicyEntries: List(),
      privacyPolicyEntries: List.of(Map({ localeCode: 'en', value: 'foobar' }))
    });
    expect(legalContents(oldState, action)).toEqual(expected);
  });

  it('should handle UPDATE_LEGAL_CONTENTS action type', () => {
    const action = {
      type: actionTypes.UPDATE_LEGAL_CONTENTS,
      legalNoticeEntries: List.of(
        Map({ localeCode: 'en', value: 'My legal notice' }),
        Map({ localeCode: 'fr', value: 'Ma notice légale' })
      ),
      termsAndConditionsEntries: List.of(
        Map({ localeCode: 'en', value: 'My terms and conditions' }),
        Map({ localeCode: 'fr', value: 'Mes conditions générales' })
      ),
      cookiesPolicyEntries: List.of(
        Map({ localeCode: 'en', value: 'My informations on cookies' }),
        Map({ localeCode: 'fr', value: 'Mes informations sur les cookies' })
      ),
      privacyPolicyEntries: List.of(
        Map({ localeCode: 'en', value: 'My privacy policy' }),
        Map({ localeCode: 'fr', value: 'Ma politique de protection des données' })
      )
    };
    const oldState = Map({
      _hasChanged: true,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List()
    });
    const expected = Map({
      _hasChanged: false,
      legalNoticeEntries: List.of(
        Map({ localeCode: 'en', value: 'My legal notice' }),
        Map({ localeCode: 'fr', value: 'Ma notice légale' })
      ),
      termsAndConditionsEntries: List.of(
        Map({ localeCode: 'en', value: 'My terms and conditions' }),
        Map({ localeCode: 'fr', value: 'Mes conditions générales' })
      ),
      cookiesPolicyEntries: List.of(
        Map({ localeCode: 'en', value: 'My informations on cookies' }),
        Map({ localeCode: 'fr', value: 'Mes informations sur les cookies' })
      ),
      privacyPolicyEntries: List.of(
        Map({ localeCode: 'en', value: 'My privacy policy' }),
        Map({ localeCode: 'fr', value: 'Ma politique de protection des données' })
      )
    });
    expect(legalContents(oldState, action)).toEqual(expected);
  });
});