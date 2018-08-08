// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import arrayMutators from 'final-form-arrays';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { Field } from 'react-final-form';

// Components
import AdminForm from '../../form/adminForm';
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import LoadSaveReinitializeForm from '../../../components/form/LoadSaveReinitializeForm';
import Navbar from '../navbar';
import Loader from '../../common/loader';
import Helper from '../../common/helper';

// Functions
import { load, postLoadFormat } from './load'; // Load file needs to be updated according to bright mirror requirements
import { createMutationsPromises, save } from './save'; // Save file needs to be updated according to bright mirror requirements
import validate from './validate'; // Save file needs to be updated according to bright mirror requirements

type Props = {
  currentStep: number,
  client: ApolloClient,
  editLocale: string
};

const name = 'themes[0]'; // We have only one thematic for BrightMirror

const loading = <Loader />;

const BrightMirrorAdminForm = ({ client, currentStep, editLocale }: Props) => (
  <LoadSaveReinitializeForm
    load={(fetchPolicy: FetchPolicy) => load(client, fetchPolicy)}
    loading={loading}
    postLoadFormat={postLoadFormat}
    createMutationsPromises={createMutationsPromises(client)}
    save={save}
    validate={validate}
    mutators={{
      ...arrayMutators
    }}
    render={({ handleSubmit, pristine, submitting }) => {
      const upperCaseLocale = editLocale.toUpperCase();
      const titleName = `${name}.title`;
      const descriptionName = `${name}.description`;
      const imageName = `${name}.img`;
      const announcementTitleName = `${name}.announcement.title`;
      const announcementBodyName = `${name}.announcement.body`;
      const titleLabel = `${I18n.t('administration.brightMirrorSection.thematicTitleLabel')} ${upperCaseLocale}`;
      const descriptionLabel = `${I18n.t('administration.brightMirrorSection.bannerSubtitleLabel')} ${upperCaseLocale}`;
      const imageLabel = `${I18n.t('administration.brightMirrorSection.bannerImagePickerLabel')} ${upperCaseLocale}`;
      const announcementTitleLabel = `${I18n.t('administration.brightMirrorSection.sectionTitleLabel')} ${upperCaseLocale}`;
      const announcementBodyLabel = `${I18n.t('administration.brightMirrorSection.instructionLabel')} ${upperCaseLocale}`;

      return (
        <React.Fragment>
          <div className="admin-content">
            <AdminForm handleSubmit={handleSubmit} pristine={pristine} submitting={submitting}>
              <div className="form-container">
                <Helper
                  label={I18n.t('administration.headerTitle')}
                  helperUrl="/static2/img/helpers/helper2.jpg"
                  helperText="TO BE DEFINED and IMAGE TO BE CHANGED (translation to add in translation.js)"
                  classname="title"
                />
                <Field
                  key={`${titleName}-${editLocale}`}
                  editLocale={editLocale}
                  name={titleName}
                  label={titleLabel}
                  component={MultilingualTextFieldAdapter}
                  required
                />
                <Field
                  key={`${descriptionName}-${editLocale}`}
                  editLocale={editLocale}
                  name={descriptionName}
                  component={MultilingualTextFieldAdapter}
                  label={descriptionLabel}
                />
                <Field name={imageName} component={FileUploaderFieldAdapter} label={imageLabel} required />
                <Helper
                  label={I18n.t('administration.instructions')}
                  helperUrl="/static2/img/helpers/helper2.jpg"
                  helperText="TO BE DEFINED and IMAGE TO BE CHANGED (translation to add in translation.js)"
                  classname="title"
                />
                <Field
                  key={`${announcementTitleName}-${editLocale}`}
                  editLocale={editLocale}
                  name={announcementTitleName}
                  label={announcementTitleLabel}
                  component={MultilingualTextFieldAdapter}
                  required
                />
                <Field
                  key={`${announcementBodyName}-${editLocale}`}
                  editLocale={editLocale}
                  name={announcementBodyName}
                  label={announcementBodyLabel}
                  component={MultilingualRichTextFieldAdapter}
                />
              </div>
            </AdminForm>
          </div>
          {!isNaN(currentStep) && (
            <Navbar
              currentStep={currentStep}
              totalSteps={1}
              phaseIdentifier="brightMirror"
              beforeChangeSection={() => (pristine || submitting) && handleSubmit()}
            />
          )}
        </React.Fragment>
      );
    }}
  />
);

const mapStateToProps = state => ({
  editLocale: state.admin.editLocale
});

export default compose(connect(mapStateToProps), withApollo)(BrightMirrorAdminForm);