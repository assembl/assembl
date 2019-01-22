// @flow
import React from 'react';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { connect } from 'react-redux';
import { Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import isEqualWith from 'lodash/isEqualWith';

import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import validate from './validate';
import Loader from '../../../common/loader';
import LoadSaveReinitializeForm from '../../../form/LoadSaveReinitializeForm';
import AdminForm from '../../../form/adminForm';
import MultilingualTextFieldAdapter from '../../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../../form/multilingualRichTextFieldAdapter';
import { compareEditorState } from '../../../form/utils';

type Props = {
  client: ApolloClient,
  lang: string,
  editLocale: string
};

const loading = <Loader />;

// TODO remove all $FlowFixMe

const TextMultimedia = ({ client, lang, editLocale }: Props) => (
  <LoadSaveReinitializeForm
    // $FlowFixMe
    load={() => load()}
    loading={loading}
    postLoadFormat={postLoadFormat}
    // $FlowFixMe
    createMutationsPromises={createMutationsPromises(client, lang)}
    // $FlowFixMe
    save={save}
    validate={validate}
    mutators={{
      ...arrayMutators
    }}
    render={({ handleSubmit, submitting, initialValues, values }) => {
      const pristine = isEqualWith(initialValues, values, compareEditorState);
      return (
        <div className="admin-content">
          <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
            <div className="form-container">
              <Field
                required
                editLocale={editLocale}
                name="title"
                component={MultilingualTextFieldAdapter}
                label="titre du module texte et multimedia"
              />
              <Field
                editLocale={editLocale}
                name="body"
                component={MultilingualRichTextFieldAdapter}
                label="Contenu du module texte et multimedia"
                withAttachmentButton
              />
            </div>
          </AdminForm>
        </div>
      );
    }}
  />
);

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  editLocale: state.admin.editLocale
});

export default compose(connect(mapStateToProps), withApollo)(TextMultimedia);