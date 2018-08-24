// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import LoadSaveReinitializeForm from '../../form/LoadSaveReinitializeForm';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import { load, postLoadFormat } from './load';
import Loader from '../../common/loader';
import validate from './validate';
// import { save, createMutationsPromises } from './save';
import AdminForm from '../../../components/form/adminForm';
import { getEntryValueForLocale } from '../../../utils/i18n';

const loading = <Loader />;

type Props = {
  client: ApolloClient,
  editLocale: string,
  lang: string
};

const DumbLegalContentsForm = ({ client, editLocale, lang }: Props) => {
  const legalNoticeLabel = I18n.t('administration.legalContents.legalNoticeLabel');
  const tacLabel = I18n.t('administration.legalContents.termsAndConditionsLabel');
  const cookiesPolicyLabel = I18n.t('administration.legalContents.cookiesPolicyLabel');
  const privacyPolicyLabel = I18n.t('administration.legalContents.privacyPolicyLabel');
  const userGuidelinesLabel = I18n.t('administration.legalContents.userGuidelinesLabel');

  return (
    <LoadSaveReinitializeForm
      load={(fetchPolicy: fetchPolicy) => load(client, fetchPolicy, lang)}
      loading={loading}
      postLoadFormat={postLoadFormat}
      createMutationsPromises={() => {}}
      save={() => {}}
      validate={validate}
      mutators={{
        ...arrayMutators
      }}
      render={({ handleSubmit, pristine, submitting }) => (
        <div className="admin-content">
          <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
            <div className="form-container">
              <Field
                key={`tac-${editLocale}`}
                editLocale={editLocale}
                name="termsAndConditions"
                component={MultilingualRichTextFieldAdapter}
                required
                label={tacLabel}
              />
              <Field
                key={`legal-notice-${editLocale}`}
                editLocale={editLocale}
                name="legalNotice"
                component={MultilingualRichTextFieldAdapter}
                required
                label={legalNoticeLabel}
              />
              <Field
                key={`cookie-policy-${editLocale}`}
                editLocale={editLocale}
                name="cookiesPolicy"
                component={MultilingualRichTextFieldAdapter}
                required
                label={cookiesPolicyLabel}
              />
              <Field
                key={`privacy-policy-${editLocale}`}
                editLocale={editLocale}
                name="privacyPolicy"
                component={MultilingualRichTextFieldAdapter}
                required
                label={privacyPolicyLabel}
              />
              <Field
                key={`user-guidelines-${editLocale}`}
                editLocale={editLocale}
                name="userGuidelines"
                component={MultilingualRichTextFieldAdapter}
                required
                label={userGuidelinesLabel}
              />
            </div>
          </AdminForm>
        </div>
      )}
    />
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

export default compose(connect(mapStateToProps), withApollo)(DumbLegalContentsForm);