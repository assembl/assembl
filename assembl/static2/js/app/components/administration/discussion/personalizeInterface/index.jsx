// @flow
import React from 'react';
import { type ApolloClient, withApollo } from 'react-apollo';
import { I18n, Translate } from 'react-redux-i18n';
import { Field } from 'react-final-form';

import LoadSaveReinitializeForm, { type TValues } from '../../../form/LoadSaveReinitializeForm';
import SaveButton from '../../saveButton';
import SectionTitle from '../../sectionTitle';
import FileUploaderFieldAdapter from '../../../form/fileUploaderFieldAdapter';
import TextFieldAdapter from '../../../form/textFieldAdapter';
import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import validate from './validate';
import Loader from '../../../common/loader';
import { DEFAULT_FAVICON } from '../../../../constants';

type Props = {
  client: ApolloClient
};

const loading = <Loader />;

const PersonalizeInterface = ({ client }: Props) => (
  <div className="admin-box">
    <SectionTitle title={I18n.t('administration.discussion.6')} annotation={I18n.t('administration.annotation')} />
    <div className="admin-language-content">
      <LoadSaveReinitializeForm
        load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy)}
        loading={loading}
        postLoadFormat={postLoadFormat}
        createMutationsPromises={createMutationsPromises(client)}
        save={save}
        afterSave={(values: TValues) => {
          // Update the title and the favicon of the page
          const head = document.head;
          if (head) {
            // Update the title
            const pageTitle = head.getElementsByTagName('title')[0];
            if (pageTitle) pageTitle.text = values.title;
            // Update the favicon
            const faviconLink = head.querySelector('link[rel="icon"]');
            // Use the default favicon if favicon is null
            let faviconUrl = values.favicon ? values.favicon.externalUrl : DEFAULT_FAVICON;
            faviconUrl = typeof faviconUrl === 'object' ? window.URL.createObjectURL(faviconUrl) : faviconUrl;
            if (faviconLink) faviconLink.setAttribute('href', faviconUrl);
          }
        }}
        validate={validate}
        render={({ handleSubmit, pristine, submitting }) => (
          <React.Fragment>
            <div>
              <Translate value="administration.personalizeInterface.titleFormTitle" />
            </div>
            <div className="img-helper-container">
              <img
                className="img-helper"
                src={'/static2/img/helpers/discussion_admin/favicon_title.png'}
                alt="personalize-interface-helper"
              />
            </div>
            <form className="language-list" onSubmit={handleSubmit}>
              <SaveButton disabled={pristine || submitting} saveAction={handleSubmit} />
              <Field
                required
                name="title"
                component={TextFieldAdapter}
                label={I18n.t('administration.personalizeInterface.title')}
              />
              <div className="separator" />
              <Field
                name="favicon"
                component={FileUploaderFieldAdapter}
                label={I18n.t('administration.personalizeInterface.favicon')}
              />
              <p className="label-indication">{I18n.t('administration.personalizeInterface.faviconInstruction')}</p>
              <div className="separator" />
              <Field
                component={FileUploaderFieldAdapter}
                name="logo"
                label={I18n.t('administration.discussionPreferences.debateLogoLabel')}
              />
              <p className="label-indication">{I18n.t('administration.personalizeInterface.logoInstruction')}</p>
            </form>
          </React.Fragment>
        )}
      />
    </div>
  </div>
);

export default withApollo(PersonalizeInterface);