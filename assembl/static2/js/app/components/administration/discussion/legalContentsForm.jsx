// @flow
import * as React from 'react';
import { Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { type RawContentState } from 'draft-js';

import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import * as actions from '../../../actions/adminActions/legalContents';
import type { State } from '../../../reducers/rootReducer';
import { getEntryValueForLocale } from '../../../utils/i18n';

type LegalContentsFormProps = {
  legalNotice: ?RawContentState,
  editLocale: string,
  termsAndConditions: ?RawContentState,
  cookiesPolicy: ?RawContentState,
  privacyPolicy: ?RawContentState,
  updateLegalNotice: Function,
  updateTermsAndConditions: Function,
  updateCookiesPolicy: Function,
  updatePrivacyPolicy: Function
};

export const DumbLegalContentsForm = ({
  legalNotice,
  editLocale,
  termsAndConditions,
  updateLegalNotice,
  updateTermsAndConditions,
  cookiesPolicy,
  privacyPolicy,
  updateCookiesPolicy,
  updatePrivacyPolicy
}: LegalContentsFormProps) => {
  const legalNoticeLabel = I18n.t('administration.legalContents.legalNoticeLabel');
  const tacLabel = I18n.t('administration.legalContents.termsAndConditionsLabel');
  const cookiesPolicyLabel = I18n.t('administration.legalContents.cookiesPolicyLabel');
  const privacyPolicyLabel = I18n.t('administration.legalContents.privacyPolicyLabel');
  const userGuidelinesLabel = I18n.t('administration.legalContents.userGuidelinesLabel');
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.discussion.4')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <Row>
          <div className="form-container">
            <FormControlWithLabel
              id="terms-and-conditions"
              key={`tac-${editLocale}`}
              label={tacLabel}
              onChange={updateTermsAndConditions}
              required
              type="rich-text"
              value={termsAndConditions}
            />
            <div className="separator" />
            <FormControlWithLabel
              id="legal-notice"
              key={`legal-notice-${editLocale}`}
              label={legalNoticeLabel}
              onChange={updateLegalNotice}
              required
              type="rich-text"
              value={legalNotice}
            />
            <div className="separator" />
            <FormControlWithLabel
              id="cookie-policy"
              key={`cookies-policy-${editLocale}`}
              label={cookiesPolicyLabel}
              onChange={updateCookiesPolicy}
              required
              type="rich-text"
              value={cookiesPolicy}
            />
            <div className="separator" />
            <FormControlWithLabel
              id="privacy-policy"
              key={`privacy-policy-${editLocale}`}
              label={privacyPolicyLabel}
              onChange={updatePrivacyPolicy}
              required
              type="rich-text"
              value={privacyPolicy}
            />
            <div className="separator" />
            <FormControlWithLabel
              id="user-guidelines"
              key={`user-guidelines-${editLocale}`}
              label={userGuidelinesLabel}
              onChange={() => {}} // fix
              required
              type="rich-text"
              value={null} // fix
            />
          </div>
        </Row>
      </div>
    </div>
  );
};

const mapStateToProps = (state: State, { editLocale }: LegalContentsFormProps) => {
  const legalContents = state.admin.legalContents;
  const legalNotice = getEntryValueForLocale(legalContents.get('legalNoticeEntries'), editLocale);
  const termsAndConditions = getEntryValueForLocale(legalContents.get('termsAndConditionsEntries'), editLocale);
  const cookiesPolicy = getEntryValueForLocale(legalContents.get('cookiesPolicyEntries'), editLocale);
  const privacyPolicy = getEntryValueForLocale(legalContents.get('privacyPolicyEntries'), editLocale);
  return {
    legalNotice: legalNotice && typeof legalNotice !== 'string' ? legalNotice.toJS() : null,
    termsAndConditions: termsAndConditions && typeof termsAndConditions !== 'string' ? termsAndConditions.toJS() : null,
    cookiesPolicy: cookiesPolicy && typeof cookiesPolicy !== 'string' ? cookiesPolicy.toJS() : null,
    privacyPolicy: privacyPolicy && typeof privacyPolicy !== 'string' ? privacyPolicy.toJS() : null
  };
};

const mapDispatchToProps = (dispatch: Function, { editLocale }: LegalContentsFormProps) => ({
  updateLegalNotice: (value: string) => dispatch(actions.updateLegalNoticeEntry(editLocale, value)),
  updateTermsAndConditions: (value: string) => dispatch(actions.updateTermsAndConditionsEntry(editLocale, value)),
  updateCookiesPolicy: (value: string) => dispatch(actions.updateCookiesPolicyEntry(editLocale, value)),
  updatePrivacyPolicy: (value: string) => dispatch(actions.updatePrivacyPolicyEntry(editLocale, value))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbLegalContentsForm);