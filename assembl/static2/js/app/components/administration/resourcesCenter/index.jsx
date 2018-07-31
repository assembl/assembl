// @flow
import React from 'react';
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
import { createResourceTooltip, deleteResourceTooltip } from '../../common/tooltips';

import LoadSaveReinitializeForm from '../../../components/form/LoadSaveReinitializeForm';
import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import validate from './validate';
import Loader from '../../common/loader';
import SaveButton from '../../../components/administration/saveButton';

type Props = {
  client: ApolloClient,
  editLocale: string
};

const loading = <Loader />;

class ResourcesCenterAdminForm extends React.Component<Props> {
  // componentDidMount() {
  //   this.props.router.setRouteLeaveHook(this.props.route, this.routerWillLeave);
  // }

  // componentWillUnmount() {
  //   this.props.router.setRouteLeaveHook(this.props.route, null);
  // }

  // routerWillLeave = () => {
  //   if (this.dataHaveChanged() && !this.state.refetching) {
  //     return I18n.t('administration.confirmUnsavedChanges');
  //   }

  //   return null;
  // };

  render() {
    const { editLocale, client } = this.props;
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
                titleMsgId="administration.resourcesCenter.editResourceFormTitle"
                tooltips={{
                  addTooltip: createResourceTooltip,
                  deleteTooltip: deleteResourceTooltip
                }}
              />
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

export default compose(connect(mapStateToProps), withApollo)(ResourcesCenterAdminForm);