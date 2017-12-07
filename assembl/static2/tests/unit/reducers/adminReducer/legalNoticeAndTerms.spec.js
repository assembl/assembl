import { List, Map } from 'immutable';

import * as actionTypes from '../../../../js/app/actions/actionTypes';
import legalNoticeAndTerms from '../../../../js/app/reducers/adminReducer/legalNoticeAndTerms';

describe('legalNoticeAndTerms admin reducer', () => {
  it('it should return the initial state', () => {
    const action = {};
    const expected = Map({
      hasChanged: false,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List()
    });
    expect(legalNoticeAndTerms(undefined, action)).toEqual(expected);
  });

  it('should return the current state for other actions', () => {
    const action = { type: 'FOOBAR' };
    const oldState = Map();
    expect(legalNoticeAndTerms(oldState, action)).toEqual(oldState);
  });

  it('should handle UPDATE_LEGAL_NOTICE_ENTRY action type', () => {
    const action = {
      type: actionTypes.UPDATE_LEGAL_NOTICE_ENTRY,
      locale: 'en',
      value: 'foobar'
    };
    const oldState = Map({
      hasChanged: false,
      legalNoticeEntries: List.of(Map({ localeCode: 'en', value: 'my legal notice' })),
      termsAndConditionsEntries: List()
    });
    const expected = Map({
      hasChanged: true,
      legalNoticeEntries: List.of(Map({ localeCode: 'en', value: 'foobar' })),
      termsAndConditionsEntries: List()
    });
    expect(legalNoticeAndTerms(oldState, action)).toEqual(expected);
  });

  it('should handle UPDATE_LEGAL_NOTICE_AND_TERMS action type', () => {
    const action = {
      type: actionTypes.UPDATE_LEGAL_NOTICE_AND_TERMS,
      legalNoticeEntries: List.of(
        Map({ localeCode: 'en', value: 'My legal notice' }),
        Map({ localeCode: 'fr', value: 'Ma notice légale' })
      ),
      termsAndConditionsEntries: List.of(
        Map({ localeCode: 'en', value: 'My terms and conditions' }),
        Map({ localeCode: 'fr', value: 'Mes conditions générales' })
      )
    };
    const oldState = Map({
      hasChanged: true,
      legalNoticeEntries: List(),
      termsAndConditionsEntries: List()
    });
    const expected = Map({
      hasChanged: false,
      legalNoticeEntries: List.of(
        Map({ localeCode: 'en', value: 'My legal notice' }),
        Map({ localeCode: 'fr', value: 'Ma notice légale' })
      ),
      termsAndConditionsEntries: List.of(
        Map({ localeCode: 'en', value: 'My terms and conditions' }),
        Map({ localeCode: 'fr', value: 'Mes conditions générales' })
      )
    });
    expect(legalNoticeAndTerms(oldState, action)).toEqual(expected);
  });
});