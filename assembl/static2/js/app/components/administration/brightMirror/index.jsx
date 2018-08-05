// @flow
import React from 'react';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import arrayMutators from 'final-form-arrays';
import { type ApolloClient, compose, withApollo } from 'react-apollo';
import { Field } from 'react-final-form';

// Components
import FileUploaderFieldAdapter from '../../form/fileUploaderFieldAdapter';
import MultilingualTextFieldAdapter from '../../form/multilingualTextFieldAdapter';
import MultilingualRichTextFieldAdapter from '../../form/multilingualRichTextFieldAdapter';
import LoadSaveReinitializeForm from '../../../components/form/LoadSaveReinitializeForm';
import SaveButton from '../../../components/administration/saveButton';
import Loader from '../../common/loader';
import Helper from '../../common/helper';

// Functions
import { load, postLoadFormat } from './load'; // Load file needs to be updated according to bright mirror requirements
import { createMutationsPromises, save } from './save'; // Save file needs to be updated according to bright mirror requirements
import validate from './validate'; // Save file needs to be updated according to bright mirror requirements

type Props = {
  client: ApolloClient,
  editLocale: string
};

const loading = <Loader />;

class BrightMirrorAdminForm extends React.Component<Props> {
  render() {
    const { client, editLocale } = this.props;
    const name = 'bright-mirror';
    return (
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
        render={({ handleSubmit, pristine, submitting }) => (
          <div className="admin-content">
            <form onSubmit={handleSubmit}>
              <SaveButton disabled={pristine || submitting} saveAction={handleSubmit} />
              <div className="form-container">
                <Helper
                  label={I18n.t('administration.headerTitle')}
                  helperUrl="/static2/img/helpers/helper2.jpg"
                  helperText="TO BE DEFINED and IMAGE TO BE CHANGED (translation to add in translation.js)"
                  classname="title"
                />
                <Field
                  editLocale={editLocale}
                  name={`${name}.title`}
                  component={MultilingualTextFieldAdapter}
                  label={`${I18n.t('administration.brightMirrorSection.thematicTitleLabel')} ${editLocale.toUpperCase()}`}
                  required
                />
                <Field
                  editLocale={editLocale}
                  name={`${name}.title`}
                  component={MultilingualTextFieldAdapter}
                  label={`${I18n.t('administration.brightMirrorSection.bannerSubtitleLabel')} ${editLocale.toUpperCase()}`}
                  required
                />
                <Field
                  name={`${name}.img`}
                  component={FileUploaderFieldAdapter}
                  label={I18n.t('administration.brightMirrorSection.bannerImagePickerLabel')}
                />
                <Helper
                  label={I18n.t('administration.instructions')}
                  helperUrl="/static2/img/helpers/helper2.jpg"
                  helperText="TO BE DEFINED and IMAGE TO BE CHANGED (translation to add in translation.js)"
                  classname="title"
                />
                <Field
                  editLocale={editLocale}
                  name={`${name}.title`}
                  component={MultilingualTextFieldAdapter}
                  label={`${I18n.t('administration.brightMirrorSection.sectionTitleLabel')} ${editLocale.toUpperCase()}`}
                  required
                />
                <Field
                  key={`${name}-text-${editLocale}`}
                  editLocale={editLocale}
                  name={`${name}.text`}
                  component={MultilingualRichTextFieldAdapter}
                  label={`${I18n.t('administration.brightMirrorSection.instructionLabel')} ${editLocale.toUpperCase()}`}
                />
              </div>
            </form>
          </div>
        )}
      />
    );
  }
}

const mapStateToProps = ({ admin: { editLocale, resourcesCenter } }) => {
  const { page, resourcesById, resourcesHaveChanged, resourcesInOrder } = resourcesCenter;
  return {
    editLocale: editLocale,
    pageHasChanged: page.get('_hasChanged'),
    resourcesCenterPage: page,
    resourcesHaveChanged: resourcesHaveChanged,
    resources: resourcesInOrder.map(id => resourcesById.get(id).toJS())
  };
};

export default compose(connect(mapStateToProps), withApollo)(BrightMirrorAdminForm);