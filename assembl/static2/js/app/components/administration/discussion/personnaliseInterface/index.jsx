// @flow
import React from 'react';
import { type ApolloClient, withApollo } from 'react-apollo';
import arrayMutators from 'final-form-arrays';
import { I18n, Translate } from 'react-redux-i18n';
import { Field } from 'react-final-form';

import LoadSaveReinitializeForm from '../../../form/LoadSaveReinitializeForm';
import SaveButton from '../../saveButton';
import SectionTitle from '../../sectionTitle';
import FileUploaderFieldAdapter from '../../../form/fileUploaderFieldAdapter';
import TextFieldAdapter from '../../../form/textFieldAdapter';
import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import validate from './validate';
import Loader from '../../../common/loader';

type Props = {
  client: ApolloClient
};

const loading = <Loader />;

const PersonnaliseInterface = ({ client }: Props) => (
  <div className="admin-box">
    <SectionTitle title={I18n.t('administration.discussion.6')} annotation={I18n.t('administration.annotation')} />
    <div className="admin-language-content">
      <div>
        <Translate value="administration.personnaliseInterface.titleFormTitle" />
      </div>
      <LoadSaveReinitializeForm
        load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy)}
        loading={loading}
        postLoadFormat={postLoadFormat}
        createMutationsPromises={createMutationsPromises(client)}
        save={save}
        validate={validate}
        mutators={{
          ...arrayMutators
        }}
        render={({ handleSubmit, pristine, submitting }) => (
          <form className="language-list" onSubmit={handleSubmit}>
            <SaveButton disabled={pristine || submitting} saveAction={handleSubmit} />
            <Field name="title" component={TextFieldAdapter} label={'title'} />
            <Field name="favicon" component={FileUploaderFieldAdapter} label={'favicon'} />
          </form>
        )}
      />
    </div>
  </div>
);

export default withApollo(PersonnaliseInterface);