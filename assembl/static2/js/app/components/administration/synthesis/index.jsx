// @flow
import React from 'react';
import { connect } from 'react-redux';
import { type ApolloClient, withApollo, compose } from 'react-apollo';
import { Row, Col } from 'react-bootstrap';
import { Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';

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
import { I18n } from 'react-redux-i18n';

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
          <Section title="debate.syntheses.createNewSynthesis" translate>
            <Row>
              <Col xs={8}>
                <div className="admin-box">
                  <Field
                    editLocale={editLocale}
                    name="title"
                    component={MultilingualTextFieldAdapter}
                    label={I18n.t('debate.syntheses.title')}
                    required
                  />
                  <Field
                    editLocale={editLocale}
                    name="url"
                    component={MultilingualTextFieldAdapter}
                    label={I18n.t('debate.syntheses.url')}
                    required
                  />
                  <div className="flex">
                    <Field name="picture" component={FileUploaderFieldAdapter} label={I18n.t('debate.syntheses.picture')} />
                    <Helper helperText="Photo de l'encarté dans la page des synthèses" popOverClass=" " />
                  </div>
                </div>
              </Col>
            </Row>
          </Section>
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