// @flow
import React from 'react';
import { connect } from 'react-redux';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { Col, Row } from 'react-bootstrap';
import { Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { I18n } from 'react-redux-i18n';
// Components imports
import Section from '../../common/section';
import LoadSaveReinitializeForm from '../../form/LoadSaveReinitializeForm';
import Loader from '../../common/loader';
import AdminForm from '../../../components/form/adminForm';

import { createMutationsPromises, save } from './save';
import { load, postLoadFormat } from './load';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import Helper from '../../common/helper';
import BackButton from '../../debate/common/backButton';
import { redirectToPreviousPage } from '../../form/utils';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import { displayLanguageMenu } from '../../../actions/adminActions';
import LanguageMenu from '../languageMenu';
import { browserHistory } from '../../../router';
import { get as getLink } from '../../../utils/routeMap';

type Props = {
  client: ApolloClient,
  editLocale: string,
  lang: string,
  displayLanguageMenu: Function,
  routeParams: {
    slug: string,
    synthesisId: string;
  }
};

const loading = <Loader/>;

class CreateSynthesisForm extends React.Component<Props> {

  componentDidMount() {
    this.props.displayLanguageMenu(false);
  }

  render() {
    const { client, editLocale, routeParams } = this.props;
    const synthesisPostId = routeParams.synthesisId;
    const redirectToList = () => {
      browserHistory.push(getLink('syntheses', { slug: routeParams.slug }))
    };
    return (
      <LoadSaveReinitializeForm
        load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy, synthesisPostId)}
        loading={loading}
        createMutationsPromises={createMutationsPromises(client, synthesisPostId)}
        postLoadFormat={postLoadFormat}
        save={save}
        afterSave={redirectToList}
        validate={() => {
        }}
        mutators={{ ...arrayMutators }}
        render={({ handleSubmit, pristine, submitting }) => (
          <div className="administration max-container create-synthesis-form">
            <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
              <Row>
                <Col xs={12} md={10}>
                  <LanguageMenu/>
                  <div className="admin-box">
                    <BackButton handleClick={redirectToPreviousPage} linkClassName="back-btn"/>
                    <Section
                      title={!synthesisPostId ? 'debate.syntheses.createNewSynthesis' : 'debate.syntheses.editSynthesis'}
                      translate>
                      <Field
                        editLocale={editLocale}
                        name="subject"
                        component={MultilingualTextFieldAdapter}
                        label={I18n.t('debate.syntheses.title')}
                        required
                      />
                      <div className="flex">
                        <Field name="image"
                               component={FileUploaderFieldAdapter}
                               label={I18n.t('debate.syntheses.picture')}
                        />
                        <Helper helperText={I18n.t('debate.syntheses.pictureHelper')} popOverClass=" "/>
                        {/* TODO: add image to the helper */}
                      </div>
                      <div className="flex richtext-large">
                        <Field
                          editLocale={editLocale}
                          name="body"
                          component={MultilingualRichTextFieldAdapter}
                          label={I18n.t('debate.syntheses.body')}
                          withAttachmentButton
                          withSideToolbar
                          rows={1000}
                        />
                      </div>
                    </Section>
                  </div>
                </Col>
              </Row>
            </AdminForm>
            <div id="save-button">&nbsp;</div>
          </div>
        )}
      />)
  };
}

const mapStateToProps = ({ admin, i18n }) => ({
  editLocale: admin.editLocale,
  lang: i18n.locale
});

const mapDispatchToProps = dispatch => ({
  displayLanguageMenu: isHidden => dispatch(displayLanguageMenu(isHidden)),
});

export default compose(connect(mapStateToProps, mapDispatchToProps), withApollo)(CreateSynthesisForm);
