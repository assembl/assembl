// @flow
import React from 'react';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { connect } from 'react-redux';
import { Field } from 'react-final-form';
import { I18n, Translate } from 'react-redux-i18n';
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
import RadioButtonsFieldAdapter from '../../../form/radioButtonsFieldAdapter';
import SectionTitle from '../../../administration/sectionTitle';
import Layouts from './layouts';
import { compareEditorState } from '../../../form/utils';

type Props = {
  client: ApolloClient,
  lang: string,
  editLocale: string
};

const loading = <Loader />;

// TODO remove all $FlowFixMe when the load.js and the save.js are done

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
        <div className="discussion-admin admin-box admin-content">
          <SectionTitle title={I18n.t('administration.textMultimediaSection')} annotation={I18n.t('administration.annotation')} />
          <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
            <div className="form-container">
              <Field
                required
                editLocale={editLocale}
                name="title"
                component={MultilingualTextFieldAdapter}
                label={I18n.t('administration.textMultimediaTitle')}
              />
              <div className="dark-title-6">
                <Translate value="administration.textMultimediaLayout" />
              </div>
              <div className="text-multimedia-layout margin-m">
                <Layouts />
                <Field required name="layoutOptions" component={RadioButtonsFieldAdapter} />
              </div>
              <Field
                required
                editLocale={editLocale}
                name="body"
                component={MultilingualRichTextFieldAdapter}
                label={I18n.t('administration.textMultimediaBody')}
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