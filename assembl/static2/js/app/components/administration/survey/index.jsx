// @flow
import React from 'react';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { connect } from 'react-redux';
import arrayMutators from 'final-form-arrays';

import LoadSaveReinitializeForm from '../../form/LoadSaveReinitializeForm';
import Navbar from '../navbar';
import SaveButton from '../saveButton';
import Step1 from './step1';
import Step2 from './step2';
import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import validate from './validate';
import Loader from '../../common/loader';

type Props = {
  client: ApolloClient,
  currentStep: number,
  editLocale: string
};

const loading = <Loader />;

const DumbSurveyAdminForm = ({ client, currentStep, editLocale }: Props) => (
  <LoadSaveReinitializeForm
    load={() => load(client)}
    loading={loading}
    postLoadFormat={postLoadFormat}
    createMutationsPromises={createMutationsPromises(client)}
    save={save}
    validate={validate}
    mutators={{
      ...arrayMutators
    }}
    render={({ handleSubmit, pristine, submitting, values }) => (
      <React.Fragment>
        <div className="admin-content">
          <form onSubmit={handleSubmit}>
            <SaveButton disabled={pristine || submitting} saveAction={handleSubmit} />
            {currentStep === 1 && <Step1 editLocale={editLocale} />}
            {currentStep === 2 && <Step2 editLocale={editLocale} values={values} />}
          </form>
        </div>
        {!isNaN(currentStep) && (
          <Navbar currentStep={currentStep} totalSteps={3} phaseIdentifier="surveyrff" beforeChangeSection={handleSubmit} />
        )}
      </React.Fragment>
    )}
  />
);

const mapStateToProps = state => ({ editLocale: state.admin.editLocale });

export default compose(connect(mapStateToProps), withApollo)(DumbSurveyAdminForm);