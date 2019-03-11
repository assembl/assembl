// @flow
import React from 'react';
import { connect } from 'react-redux';
import { type ApolloClient, withApollo, compose } from 'react-apollo';
import { Row, Col } from 'react-bootstrap';
import { Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { I18n } from 'react-redux-i18n';

// Components imports
import Section from '../../common/section';
import LoadSaveReinitializeForm from '../../form/LoadSaveReinitializeForm';
import Loader from '../../common/loader';
import AdminForm from '../../../components/form/adminForm';

import { createMutationPromises, save } from './save';
import { load } from './load';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import Helper from '../../common/helper';
import BackButton from '../../debate/common/backButton';
import { redirectToPreviousPage } from '../../form/utils';

type Props = {
  client: ApolloClient,
  editLocale: string,
  lang: string
};

const loading = <Loader />;

const CreateSynthesisForm = ({ client, editLocale, lang }: Props) => (
  <LoadSaveReinitializeForm
    load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy, lang)}
    loading={loading}
    createMutationPromises={createMutationPromises(client, lang)}
    save={save}
    validate={() => {}}
    mutators={{ ...arrayMutators }}
    render={({ handleSubmit, pristine, submitting }) => (
      <div className="administration max-container create-synthesis-form">
        <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
          <Row>
            <Col xs={12} md={10}>
              <div className="admin-box">
                <BackButton handleClick={redirectToPreviousPage} />
                <Section title="debate.syntheses.createNewSynthesis" translate>
                  <Field
                    editLocale={editLocale}
                    name="title"
                    component={MultilingualTextFieldAdapter}
                    label={I18n.t('debate.syntheses.title')}
                    required
                  />
                  <div className="flex url-field">
                    <Field
                      editLocale={editLocale}
                      name="url"
                      component={MultilingualTextFieldAdapter}
                      label={I18n.t('debate.syntheses.url')}
                      required
                    />
                    <Helper helperText={I18n.t('debate.syntheses.urlHelper')} popOverClass=" " />
                  </div>
                  <div className="flex">
                    <Field name="picture" component={FileUploaderFieldAdapter} label={I18n.t('debate.syntheses.picture')} />
                    <Helper helperText={I18n.t('debate.syntheses.pictureHelper')} popOverClass=" " />
                    {/* TODO: add image to the helper */}
                  </div>
                </Section>
              </div>
            </Col>
          </Row>
        </AdminForm>
      </div>
    )}
  />
);

const mapStateToProps = ({ admin, i18n }) => ({
  editLocale: admin.editLocale,
  lang: i18n.locale
});

export default compose(connect(mapStateToProps), withApollo)(CreateSynthesisForm);