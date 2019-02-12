// @flow
import React from 'react';
import isEqualWith from 'lodash/isEqualWith';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import arrayMutators from 'final-form-arrays';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { Field } from 'react-final-form';

import FieldArrayWithActions from '../../form/fieldArrayWithActions';
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import TextFieldAdapter from '../../form/textFieldAdapter';
import { compareEditorState } from '../../form/utils';
import { createResourceTooltip, deleteResourceTooltip } from '../../common/tooltips';

import AdminForm from '../../../components/form/adminForm';
import LoadSaveReinitializeForm from '../../../components/form/LoadSaveReinitializeForm';
import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import validate from './validate';
import Loader from '../../common/loader';

type Props = {
  client: ApolloClient,
  editLocale: string,
  lang: string
};

const loading = <Loader />;

class ResourcesCenterAdminForm extends React.Component<Props> {
  render() {
    const { client, editLocale, lang } = this.props;
    return (
      <LoadSaveReinitializeForm
        load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy, lang)}
        loading={loading}
        postLoadFormat={postLoadFormat}
        createMutationsPromises={createMutationsPromises(client, lang)}
        save={save}
        validate={validate}
        mutators={{
          ...arrayMutators
        }}
        render={({ handleSubmit, submitting, values, initialValues }) => {
          // Don't use final form pristine here, we need special comparison for richtext fields
          const pristine = isEqualWith(initialValues, values, compareEditorState);
          return (
            <div className="admin-content">
              <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
                <div className="form-container">
                  <Field
                    editLocale={editLocale}
                    name="pageTitle"
                    component={MultilingualTextFieldAdapter}
                    label={I18n.t('administration.resourcesCenter.pageTitleLabel')}
                    required
                  />
                  <Field
                    name="pageHeader"
                    component={FileUploaderFieldAdapter}
                    label={I18n.t('administration.resourcesCenter.headerImageLabel')}
                  />
                  <div className="separator" />
                </div>

                <FieldArrayWithActions
                  name="resources"
                  titleMsgId="administration.resourcesCenter.editResourceFormTitle"
                  tooltips={{
                    addTooltip: createResourceTooltip,
                    deleteTooltip: deleteResourceTooltip
                  }}
                  renderFields={({ name }) => (
                    <React.Fragment>
                      <Field
                        editLocale={editLocale}
                        name={`${name}.title`}
                        component={MultilingualTextFieldAdapter}
                        label={`${I18n.t('administration.resourcesCenter.titleLabel')} ${editLocale.toUpperCase()}`}
                        required
                      />
                      <Field
                        key={`${name}-text-${editLocale}`}
                        editLocale={editLocale}
                        name={`${name}.text`}
                        component={MultilingualRichTextFieldAdapter}
                        label={`${I18n.t('administration.resourcesCenter.textLabel')} ${editLocale.toUpperCase()}`}
                      />
                      <Field
                        componentClass="textarea"
                        name={`${name}.embedCode`}
                        component={TextFieldAdapter}
                        label={I18n.t('administration.resourcesCenter.embedCodeLabel')}
                      />
                      <Field
                        name={`${name}.img`}
                        component={FileUploaderFieldAdapter}
                        label={I18n.t('administration.resourcesCenter.imageLabel')}
                      />
                      <Field
                        name={`${name}.doc`}
                        component={FileUploaderFieldAdapter}
                        label={I18n.t('administration.resourcesCenter.documentLabel')}
                      />
                    </React.Fragment>
                  )}
                />
              </AdminForm>
            </div>
          );
        }}
      />
    );
  }
}

const mapStateToProps = ({ admin: { editLocale }, i18n }) => ({
  editLocale: editLocale,
  lang: i18n.locale
});

export default compose(connect(mapStateToProps), withApollo)(ResourcesCenterAdminForm);