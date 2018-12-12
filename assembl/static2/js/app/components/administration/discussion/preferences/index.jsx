// @flow
import React from 'react';
import { connect } from 'react-redux';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { I18n, Translate } from 'react-redux-i18n';
import arrayMutators from 'final-form-arrays';
import { Field } from 'react-final-form';
import Loader from '../../../common/loader';
import LoadSaveReinitializeForm from '../../../form/LoadSaveReinitializeForm';
import AdminForm from '../../../../components/form/adminForm';
import CheckboxFieldAdapter from '../../../../components/form/checkboxFieldAdapter';
import CheckboxListFieldAdapter from '../../../form/checkboxListFieldAdapter';
import SectionTitle from '../../../../components/administration/sectionTitle';
import { load, postLoadFormat } from './load';
import { save, createMutationsPromises } from './save';
import validate from './validate';

export type DiscussionPreferencesFormProps = {
  client: ApolloClient,
  locale: string
};

const loading = <Loader />;

const DiscussionPreferencesForm = ({ client, locale }: DiscussionPreferencesFormProps) => (
  <div className="discussion-admin admin-box admin-content">
    <SectionTitle title={I18n.t('administration.menu.preferences')} annotation="" />
    <LoadSaveReinitializeForm
      load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy, locale)}
      loading={loading}
      postLoadFormat={postLoadFormat}
      createMutationsPromises={createMutationsPromises(client)}
      save={save}
      validate={validate}
      mutators={{
        ...arrayMutators
      }}
      render={({ handleSubmit, pristine, submitting, values }) => (
        <div className="admin-content">
          <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
            <div className="form-container">
              <div className="title">
                <Translate value="administration.languageChoice" />
              </div>
              <div className="margin-l" />
              <Field component={CheckboxListFieldAdapter} name="languages" />
              <div className="separator" />
              <div className="title">
                <Translate value="administration.moderation" />
              </div>
              <Field
                component={CheckboxFieldAdapter}
                name="withModeration"
                isChecked={values.withModeration}
                label={I18n.t('administration.activateModeration')}
                type="checkbox"
              />
            </div>
          </AdminForm>
        </div>
      )}
    />
  </div>
);

const mapStateToProps = state => ({
  locale: state.i18n.locale
});

export { DiscussionPreferencesForm };

export default compose(connect(mapStateToProps), withApollo)(DiscussionPreferencesForm);