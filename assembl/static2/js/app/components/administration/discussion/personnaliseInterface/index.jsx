// @flow
import React from 'react';
import { type ApolloClient, withApollo } from 'react-apollo';
import arrayMutators from 'final-form-arrays';
import { I18n, Translate } from 'react-redux-i18n';
import { Field } from 'react-final-form';

import LoadSaveReinitializeForm, { type TInitialValues } from '../../../form/LoadSaveReinitializeForm';
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
      <LoadSaveReinitializeForm
        load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy)}
        loading={loading}
        postLoadFormat={postLoadFormat}
        createMutationsPromises={createMutationsPromises(client)}
        save={save}
        onSave={(values: TInitialValues) => {
          const head = document.head;
          if (head) {
            const pageTitle = head.getElementsByTagName('title')[0];
            if (pageTitle) pageTitle.text = values.title;
            const favisonLink = head.querySelectorAll('link[rel="icon"]')[0];
            let faviconUrl = values.favicon.externalUrl;
            faviconUrl = typeof faviconUrl === 'object' ? window.URL.createObjectURL(faviconUrl) : faviconUrl;
            if (favisonLink) favisonLink.setAttribute('href', faviconUrl);
          }
        }}
        validate={validate}
        mutators={{
          ...arrayMutators
        }}
        render={({ handleSubmit, pristine, submitting }) => (
          <React.Fragment>
            <div>
              <Translate value="administration.personnaliseInterface.titleFormTitle" />
            </div>
            <form className="language-list" onSubmit={handleSubmit}>
              <SaveButton disabled={pristine || submitting} saveAction={handleSubmit} />
              <Field name="title" component={TextFieldAdapter} label={I18n.t('administration.personnaliseInterface.title')} />
              <Field
                name="favicon"
                component={FileUploaderFieldAdapter}
                label={I18n.t('administration.personnaliseInterface.favicon')}
              />
            </form>
          </React.Fragment>
        )}
      />
    </div>
  </div>
);

export default withApollo(PersonnaliseInterface);