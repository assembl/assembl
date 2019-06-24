// @flow
import React from 'react';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { connect } from 'react-redux';
import { Field } from 'react-final-form';
import { I18n } from 'react-redux-i18n';
import arrayMutators from 'final-form-arrays';
import isEqualWith from 'lodash/isEqualWith';
import { Col, Row } from 'react-bootstrap';

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
import LanguageMenu from '../../languageMenu';
import { goToModulesAdmin } from '../utils';

type Props = {
  client: ApolloClient,
  editLocale: string,
  lang: string,
  landingPageModule: MultilingualLandingPageModule
};

const loading = <Loader />;

class TextMultimedia extends React.Component<Props> {
  render() {
    const { client, lang, editLocale, landingPageModule } = this.props;
    return (
      <LoadSaveReinitializeForm
        load={() => load(landingPageModule)}
        loading={loading}
        postLoadFormat={postLoadFormat}
        createMutationsPromises={createMutationsPromises(client, lang, landingPageModule)}
        save={save}
        afterSave={goToModulesAdmin}
        validate={validate}
        mutators={{
          ...arrayMutators
        }}
        render={({ handleSubmit, submitting, initialValues, values }) => {
          const pristine = isEqualWith(initialValues, values, compareEditorState);
          return (
            <div className="discussion-admin admin-box admin-content">
              <SectionTitle
                title={I18n.t('administration.textMultimediaSection')}
                annotation={I18n.t('administration.annotation')}
              />
              <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
                <Row>
                  <Col xs={12} md={10}>
                    <div className="form-container">
                      <Field
                        required
                        editLocale={editLocale}
                        name="title"
                        component={MultilingualTextFieldAdapter}
                        label={I18n.t('administration.textMultimediaTitle')}
                      />
                      <Field
                        required
                        editLocale={editLocale}
                        name="body"
                        component={MultilingualRichTextFieldAdapter}
                        label={I18n.t('administration.textMultimediaBody')}
                        withAttachmentButton
                        withCharacterCounter={10000}
                      />
                    </div>
                  </Col>
                  <Col md={1}>
                    <LanguageMenu />
                  </Col>
                </Row>
              </AdminForm>
            </div>
          );
        }}
      />
    );
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  editLocale: state.admin.editLocale
});

export default compose(connect(mapStateToProps), withApollo)(TextMultimedia);