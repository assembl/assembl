// @flow
import React from 'react';
import { connect } from 'react-redux';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import arrayMutators from 'final-form-arrays';
import { Field } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import Loader from '../../../common/loader';
import LoadSaveReinitializeForm from '../../../form/LoadSaveReinitializeForm';
import AdminForm from '../../../../components/form/adminForm';
import CheckboxFieldAdapter from '../../../../components/form/checkboxFieldAdapter';
import { load, postLoadFormat } from './load';
import { save, createMutationsPromises } from './save';
import validate from './validate';

type LanguagesPreferencesFormProps = {
  client: ApolloClient,
  locale: string
};

const loading = <Loader />;

const LanguagesPreferencesAdminForm = ({ client, locale }: LanguagesPreferencesFormProps) => (
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
    render={({ handleSubmit, pristine, submitting }) => (
      <div className="admin-content">
        <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
          <div className="form-container">
            <FieldArray name="languages">
              {({ fields }) => (
                <React.Fragment>
                  {fields.value.map(field => (
                    <Field
                      component={CheckboxFieldAdapter}
                      name={`${field.locale}`}
                      label={field.name}
                      isChecked={field.isChecked}
                      key={field.locale}
                      type="checkbox"
                    />
                  ))}
                </React.Fragment>
              )}
            </FieldArray>
          </div>
        </AdminForm>
      </div>
    )}
  />
);

const mapStateToProps = state => ({
  locale: state.i18n.locale
});

export default compose(connect(mapStateToProps), withApollo)(LanguagesPreferencesAdminForm);