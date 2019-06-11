// @flow
import React from 'react';
import { type ApolloClient, compose, graphql, withApollo } from 'react-apollo';
import { connect } from 'react-redux';
import { Field } from 'react-final-form';
import { I18n } from 'react-redux-i18n';
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
import SectionTitle from '../../../administration/sectionTitle';
import { compareEditorState } from '../../../form/utils';
import DiscussionQuery from '../../../../graphql/DiscussionQuery.graphql';

type Props = {
  client: ApolloClient,
  lang: string,
  editLocale: string
};

const loading = <Loader />;

const TextMultimedia = ({ client, lang, editLocale }: Props) => (
  <LoadSaveReinitializeForm
    load={fetchPolicy => load(client, fetchPolicy)}
    loading={loading}
    postLoadFormat={postLoadFormat}
    createMutationsPromises={createMutationsPromises(client, lang)}
    save={save}
    validate={validate}
    mutators={{
      ...arrayMutators
    }}
    render={({ handleSubmit, submitting, initialValues, values }) => {
      const pristine = isEqualWith(initialValues, values, compareEditorState);
      return (
        <div className="discussion-admin admin-box admin-content">
          <SectionTitle title={I18n.t('administration.textMultimediaSection')} annotation={I18n.t('administration.annotation')} />
          <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
            <div className="form-container">
              <Field
                required
                editLocale={editLocale}
                name="textMultimediaTitle"
                component={MultilingualTextFieldAdapter}
                label={I18n.t('administration.textMultimediaTitle')}
              />
              <Field
                required
                editLocale={editLocale}
                name="textMultimediaBody"
                component={MultilingualRichTextFieldAdapter}
                label={I18n.t('administration.textMultimediaBody')}
                withAttachmentButton
                withCharacterCounter={10000}
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

export default compose(
  connect(mapStateToProps),
  graphql(DiscussionQuery, {
    options: ({ editLocale }) => ({
      variables: {
        lang: editLocale,
        nextView: null
      }
    })
  }),
  withApollo
)(TextMultimedia);