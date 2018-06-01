import * as actions from '../../../../js/app/actions/adminActions/legalContents';
import * as actionTypes from '../../../../js/app/actions/actionTypes';

describe('legalContents admin actions', () => {
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

  describe('updateLegalContents action', () => {
    const { updateLegalContents } = actions;
    it('should return a UPDATE_LEGAL_CONTENTS action type', () => {
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
      const actual = updateLegalContents(value);
      const expected = {
        type: actionTypes.UPDATE_LEGAL_CONTENTS,
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