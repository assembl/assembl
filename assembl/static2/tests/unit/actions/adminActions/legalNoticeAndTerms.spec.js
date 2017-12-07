import * as actions from '../../../../js/app/actions/adminActions/legalNoticeAndTerms';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('legalNoticeAndTerms admin actions', () => {
  describe('updateLegalNoticeEntry action', () => {
    const { updateLegalNoticeEntry } = actions;
    it('should return a UPDATE_LEGAL_NOTICE_ENTRY action type', () => {
      const actual = updateLegalNoticeEntry('en', 'foobar');
      const expected = {
        type: actionTypes.UPDATE_LEGAL_NOTICE_ENTRY,
        locale: 'en',
        value: 'foobar'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateTermsAndConditionsEntry action', () => {
    const { updateTermsAndConditionsEntry } = actions;
    it('should return a UPDATE_TERMS_AND_CONDITIONS_ENTRY action type', () => {
      const actual = updateTermsAndConditionsEntry('en', 'foobar');
      const expected = {
        type: actionTypes.UPDATE_TERMS_AND_CONDITIONS_ENTRY,
        locale: 'en',
        value: 'foobar'
      };
      expect(actual).toEqual(expected);
    });
  });

  describe('updateLegalNoticeAndTerms action', () => {
    const { updateLegalNoticeAndTerms } = actions;
    it('should return a UPDATE_LEGAL_NOTICE_AND_TERMS action type', () => {
      const value = {
        legalNoticeEntries: [
          {
            localeCode: 'fr',
            value: 'Ma notice légale'
          }
        ],
        termsAndConditionsEntries: [
          {
            localeCode: 'fr',
            value: 'Mes conditions générales'
          }
        ]
      };
      const actual = updateLegalNoticeAndTerms(value);
      const expected = {
        type: actionTypes.UPDATE_LEGAL_NOTICE_AND_TERMS,
        legalNoticeEntries: [
          {
            localeCode: 'fr',
            value: 'Ma notice légale'
          }
        ],
        termsAndConditionsEntries: [
          {
            localeCode: 'fr',
            value: 'Mes conditions générales'
          }
        ]
      };
      expect(actual).toEqual(expected);
    });
  });
});