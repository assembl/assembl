// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Row, Col } from 'react-bootstrap';
import arrayMutators from 'final-form-arrays';
import { type ApolloClient, withApollo, compose } from 'react-apollo';

// Components imports
import Loader from '../../common/loader';
import Section from '../../common/section';
import LoadSaveReinitializeForm from '../../form/LoadSaveReinitializeForm';
import AdminForm from '../../../components/form/adminForm';

import { createMutationPromises, save } from './save';
import { load, postLoadFormat } from './load';

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
    postLoadFormat={postLoadFormat}
    createMutationPromises={createMutationPromises(client, lang)}
    save={save}
    validate={() => {}}
    mutators={{ ...arrayMutators }}
    render={({ handleSubmit, pristine, submitting, values, initialValues }) => (
      <div className="administration max-container create-synthesis-form">
        <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
          <Section title="debate.syntheses.createNewSynthesis" translate>
            <Row>
              <Col xs={8}>
                <div className="admin-box">
                  <h1>TEST</h1>
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