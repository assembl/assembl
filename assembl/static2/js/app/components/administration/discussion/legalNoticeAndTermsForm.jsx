// @flow
import React from 'react';
import { Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../sectionTitle';
import FormControlWithLabel from '../../common/formControlWithLabel';
import * as actions from '../../../actions/adminActions/legalNoticeAndTerms';
import type { RootReducer } from '../../../reducers/rootReducer';
import { getEntryValueForLocale } from '../../../utils/i18n';

type LegalNoticeAndTermsFormProps = {
  legalNotice: string,
  selectedLocale: string,
  termsAndConditions: string,
  updateLegalNotice: Function,
  updateTermsAndConditions: Function
};

export const DumbLegalNoticeAndTermsForm = ({
  legalNotice,
  selectedLocale,
  termsAndConditions,
  updateLegalNotice,
  updateTermsAndConditions
}: LegalNoticeAndTermsFormProps) => {
  const legalNoticeLabel = I18n.t('administration.legalNoticeAndTerms.legalNoticeLabel');
  const tacLabel = I18n.t('administration.legalNoticeAndTerms.termsAndConditionsLabel');
  return (
    <div className="admin-box">
      <SectionTitle title={I18n.t('administration.discussion.3')} annotation={I18n.t('administration.annotation')} />
      <div className="admin-content">
        <Row>
          <div className="form-container">
            <FormControlWithLabel
              key={`tac-${selectedLocale}-${termsAndConditions}`}
              label={`${tacLabel}*`}
              onChange={updateTermsAndConditions}
              required
              type="rich-text"
              value={termsAndConditions}
            />
            <div className="separator" />
            <FormControlWithLabel
              key={`legal-notice-${selectedLocale}-${legalNotice}`}
              label={`${legalNoticeLabel}*`}
              onChange={updateLegalNotice}
              required
              type="rich-text"
              value={legalNotice}
            />
          </div>
        </Row>
      </div>
    </div>
  );
};

const mapStateToProps = (state: RootReducer, { selectedLocale }: LegalNoticeAndTermsFormProps) => {
  const legalNoticeAndTerms = state.admin.legalNoticeAndTerms;
  const legalNotice = getEntryValueForLocale(legalNoticeAndTerms.get('legalNoticeEntries'), selectedLocale);
  const termsAndConditions = getEntryValueForLocale(legalNoticeAndTerms.get('termsAndConditionsEntries'), selectedLocale);
  return {
    legalNotice: legalNotice ? legalNotice.toJS() : '',
    termsAndConditions: termsAndConditions ? termsAndConditions.toJS() : ''
  };
};

const mapDispatchToProps = (dispatch: Function, { selectedLocale }: LegalNoticeAndTermsFormProps) => ({
  updateLegalNotice: (value: string) => dispatch(actions.updateLegalNoticeEntry(selectedLocale, value)),
  updateTermsAndConditions: (value: string) => dispatch(actions.updateTermsAndConditionsEntry(selectedLocale, value))
});

export default connect(mapStateToProps, mapDispatchToProps)(DumbLegalNoticeAndTermsForm);