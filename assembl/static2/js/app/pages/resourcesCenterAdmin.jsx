import React from 'react';
import { compose, graphql } from 'react-apollo';
import { connect } from 'react-redux';
import { I18n } from 'react-redux-i18n';

import SectionTitle from '../components/administration/sectionTitle';
import PageForm from '../components/administration/resourcesCenter/pageForm';
import ManageResourcesForm from '../components/administration/resourcesCenter/manageResourcesForm';
import createResourceMutation from '../graphql/mutations/createResource.graphql';
import updateResourceMutation from '../graphql/mutations/updateResource.graphql';
import deleteResourceMutation from '../graphql/mutations/deleteResource.graphql';
import updateResourcesCenterMutation from '../graphql/mutations/updateResourcesCenter.graphql';
import { convertEntriesToHTML } from '../utils/draftjs';
import { displayAlert } from '../utils/utilityManager';
import SaveButton, { getMutationsPromises, runSerial } from '../components/administration/saveButton';

const createVariablesForResourceMutation = resource => ({
  doc: resource.doc && typeof resource.doc.externalUrl === 'object' ? resource.doc.externalUrl : null,
  embedCode: resource.embedCode,
  image: resource.img && typeof resource.img.externalUrl === 'object' ? resource.img.externalUrl : null,
  textEntries: convertEntriesToHTML(resource.textEntries),
  titleEntries: resource.titleEntries
});

const createVariablesForDeleteResourceMutation = resource => ({ resourceId: resource.id });

class ResourcesCenterAdmin extends React.Component {
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
          refetchResourcesCenter();
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
          refetchTabsConditions();
          refetchResources();
          displayAlert('success', I18n.t('administration.resourcesCenter.successSave'));
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }
  };

  render() {
    const { editLocale, pageHasChanged, resourcesHaveChanged } = this.props;
    const saveDisabled = !pageHasChanged && !resourcesHaveChanged;
    return (
      <div className="resources-center-admin admin-box admin-content">
        <SaveButton disabled={saveDisabled} saveAction={this.saveAction} />
        <SectionTitle title={I18n.t('administration.resourcesCenter.title')} annotation={I18n.t('administration.annotation')} />
        <PageForm editLocale={editLocale} />
        <ManageResourcesForm editLocale={editLocale} />
      </div>
    );
  }
}

const mapStateToProps = ({ admin: { editLocale, resourcesCenter } }) => {
  const { page, resourcesById, resourcesHaveChanged, resourcesInOrder } = resourcesCenter;
  return {
    editLocale: editLocale,
    pageHasChanged: page.get('hasChanged'),
    resourcesCenterPage: page,
    resourcesHaveChanged: resourcesHaveChanged,
    resources: resourcesInOrder.map(id => resourcesById.get(id).toJS())
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(createResourceMutation, {
    name: 'createResource'
  }),
  graphql(updateResourceMutation, {
    name: 'updateResource'
  }),
  graphql(deleteResourceMutation, {
    name: 'deleteResource'
  }),
  graphql(updateResourcesCenterMutation, {
    name: 'updateResourcesCenter'
  })
)(ResourcesCenterAdmin);