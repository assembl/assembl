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
import Step3 from './step3';
import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import validate from './validate';
import Loader from '../../common/loader';

type Props = {
  client: ApolloClient,
  currentStep: number,
  debateId: string,
  editLocale: string,
  locale: string
};

const loading = <Loader />;

const DumbSurveyAdminForm = ({ client, currentStep, debateId, editLocale, locale }: Props) => (
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
            {currentStep === 3 && <Step3 debateId={debateId} locale={locale} />}
          </form>
        </div>
        {!isNaN(currentStep) && (
          <Navbar
            currentStep={currentStep}
            totalSteps={3}
            phaseIdentifier="survey"
            beforeChangeSection={() => (pristine || submitting) && handleSubmit()}
          />
        )}
      </React.Fragment>
    )}
  />
);

const mapStateToProps = state => ({
  debateId: state.context.debateId,
  editLocale: state.admin.editLocale,
  locale: state.i18n.locale
});

export default compose(connect(mapStateToProps), withApollo)(DumbSurveyAdminForm);