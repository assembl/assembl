// @flow
import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';
import { type Route, type Router } from 'react-router';
import arrayMutators from 'final-form-arrays';
import { type ApolloClient, compose, withApollo } from 'react-apollo';

import LoadSaveReinitializeForm from '../../../components/form/LoadSaveReinitializeForm';
import { load, postLoadFormat } from './load';
import { createMutationsPromises, save } from './save';
import validate from './validate';
import Loader from '../../common/loader';


import PageForm from '../../../components/administration/resourcesCenter/pageForm';
import ManageResourcesForm from '../../../components/administration/resourcesCenter/manageResourcesForm';
import createResourceMutation from '../../../graphql/mutations/createResource.graphql';
import updateResourceMutation from '../../../graphql/mutations/updateResource.graphql';
import deleteResourceMutation from '../../../graphql/mutations/deleteResource.graphql';
import updateResourcesCenterMutation from '../../../graphql/mutations/updateResourcesCenter.graphql';
import { convertEntriesToHTML } from '../../../utils/draftjs';
import { displayAlert } from '../../../utils/utilityManager';
import SaveButton, { getMutationsPromises, runSerial } from '../../../components/administration/saveButton';

const createVariablesForResourceMutation = resource => ({
  doc: resource.doc && typeof resource.doc.externalUrl === 'object' ? resource.doc.externalUrl : null,
  embedCode: resource.embedCode,
  image: resource.img && typeof resource.img.externalUrl === 'object' ? resource.img.externalUrl : null,
  textEntries: convertEntriesToHTML(resource.textEntries),
  titleEntries: resource.titleEntries
});

const createVariablesForDeleteResourceMutation = resource => ({ resourceId: resource.id });

type Props = {
  editLocale: string,
  pageHasChanged: boolean,
  resourcesHaveChanged: boolean,
  resources: Array<Object>,
  resourcesCenterPage: Object,
  createResource: Function,
  deleteResource: Function,
  updateResource: Function,
  updateResourcesCenter: Function,
  refetchTabsConditions: Function,
  refetchResources: Function,
  refetchResourcesCenter: Function,
  route: Route,
  router: Router
};

type State = {
  refetching: boolean
};

const loading = <Loader />;

class ResourcesCenterAdminForm extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = {
      refetching: false
    };
  }

  componentDidMount() {
    this.props.router.setRouteLeaveHook(this.props.route, this.routerWillLeave);
  }

  componentWillUnmount() {
    this.props.router.setRouteLeaveHook(this.props.route, null);
  }

  routerWillLeave = () => {
    if (this.dataHaveChanged() && !this.state.refetching) {
      return I18n.t('administration.confirmUnsavedChanges');
    }

    return null;
  };

  dataHaveChanged = () => this.props.pageHasChanged || this.props.resourcesHaveChanged;

  saveAction = () => {
    const {
      pageHasChanged,
      resourcesHaveChanged,
      resources,
      resourcesCenterPage,
      createResource,
      deleteResource,
      updateResource,
      updateResourcesCenter,
      refetchTabsConditions,
      refetchResources,
      refetchResourcesCenter
    } = this.props;
    displayAlert('success', `${I18n.t('loading.wait')}...`);
    if (pageHasChanged) {
      const pageHeaderImage = resourcesCenterPage.get('headerImage').toJS();
      const headerImage = typeof pageHeaderImage.externalUrl === 'object' ? pageHeaderImage.externalUrl : null;
      const payload = {
        variables: {
          headerImage: headerImage,
          titleEntries: resourcesCenterPage.get('titleEntries').toJS()
        }
      };
      updateResourcesCenter(payload)
        .then(() => {
          this.setState({ refetching: true });
          refetchResourcesCenter().then(() => this.setState({ refetching: false }));
          displayAlert('success', I18n.t('administration.resourcesCenter.successSave'));
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }

    if (resourcesHaveChanged) {
      const mutationsPromises = getMutationsPromises({
        items: resources,
        variablesCreator: createVariablesForResourceMutation,
        deleteVariablesCreator: createVariablesForDeleteResourceMutation,
        createMutation: createResource,
        deleteMutation: deleteResource,
        updateMutation: updateResource
      });

      runSerial(mutationsPromises)
        .then(() => {
          this.setState({ refetching: true });
          refetchTabsConditions().then(() => refetchResources().then(() => this.setState({ refetching: false })));

          displayAlert('success', I18n.t('administration.resourcesCenter.successSave'));
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }
  };

  render() {
    const { editLocale, client } = this.props;
    // const saveDisabled = !this.dataHaveChanged();
    // return (
    //   <div className="resources-center-admin admin-box admin-content">
    //     <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
    //     <SectionTitle title={I18n.t('administration.resourcesCenter.title')} annotation={I18n.t('administration.annotation')} />
    //     <PageForm editLocale={editLocale} />
    //     <ManageResourcesForm editLocale={editLocale} />
    //   </div>
    // );
    return (
      <LoadSaveReinitializeForm
        load={() => load(client)}
        loading={loading}
        postLoadFormat={postLoadFormat}
        createMutationsPromises={createMutationsPromises(client)}
        save={save}
        validate={validate}
        mutators={{
          ...arrayMutators
        }}
        render={({ handleSubmit, pristine, submitting, values }) => (
          <div className="admin-content">
            <form onSubmit={handleSubmit}>
              <SaveButton disabled={pristine || submitting} saveAction={handleSubmit} />
              <PageForm editLocale={editLocale} />
              <ManageResourcesForm editLocale={editLocale} values={values} />
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

// export default compose(
//   connect(mapStateToProps),
//   graphql(createResourceMutation, {
//     name: 'createResource'
//   }),
//   graphql(updateResourceMutation, {
//     name: 'updateResource'
//   }),
//   graphql(deleteResourceMutation, {
//     name: 'deleteResource'
//   }),
//   graphql(updateResourcesCenterMutation, {
//     name: 'updateResourcesCenter'
//   })
// )(ResourcesCenterAdminForm);

export default compose(connect(mapStateToProps), withApollo)(ResourcesCenterAdminForm);