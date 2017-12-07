import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import { displayAlert } from '../../utils/utilityManager';
import { convertEntriesToHTML } from '../../utils/draftjs';
import { languagePreferencesHasChanged, updateSelectedLocale } from '../../actions/adminActions';
import createThematicMutation from '../../graphql/mutations/createThematic.graphql';
import deleteThematicMutation from '../../graphql/mutations/deleteThematic.graphql';
import updateThematicMutation from '../../graphql/mutations/updateThematic.graphql';
import createResourceMutation from '../../graphql/mutations/createResource.graphql';
import updateResourceMutation from '../../graphql/mutations/updateResource.graphql';
import deleteResourceMutation from '../../graphql/mutations/deleteResource.graphql';
import createSectionMutation from '../../graphql/mutations/createSection.graphql';
import updateSectionMutation from '../../graphql/mutations/updateSection.graphql';
import deleteSectionMutation from '../../graphql/mutations/deleteSection.graphql';
import updateResourcesCenterMutation from '../../graphql/mutations/updateResourcesCenter.graphql';
import updateLegalNoticeAndTermsMutation from '../../graphql/mutations/updateLegalNoticeAndTerms.graphql';
import updateDiscussionPreferenceQuery from '../../graphql/mutations/updateDiscussionPreference.graphql';
import getDiscussionPreferenceLanguage from '../../graphql/DiscussionPreferenceLanguage.graphql';

const runSerial = (tasks) => {
  let result = Promise.resolve();
  tasks.forEach((task) => {
    result = result.then(task);
  });
  return result;
};

const getMutationsPromises = (params) => {
  const { items, variablesCreator, deleteVariablesCreator, createMutation, deleteMutation, updateMutation } = params;
  const promises = [];
  items.forEach((item, index) => {
    if (item.isNew && !item.toDelete) {
      // create item
      const payload = {
        variables: variablesCreator(item, index)
      };
      const p1 = () => createMutation(payload);
      promises.push(p1);
    } else if (item.toDelete && !item.isNew) {
      // delete item
      const payload = {
        variables: deleteVariablesCreator(item)
      };
      const p3 = () => deleteMutation(payload);
      promises.push(p3);
    } else {
      // update item
      const variables = variablesCreator(item, index);
      variables.id = item.id;
      const payload = {
        variables: variables
      };
      const p2 = () => updateMutation(payload);
      promises.push(p2);
    }
  });

  return promises;
};

function convertVideoDescriptionsToHTML(video) {
  return {
    ...video,
    descriptionEntriesBottom: convertEntriesToHTML(video.descriptionEntriesBottom),
    descriptionEntriesSide: convertEntriesToHTML(video.descriptionEntriesSide),
    descriptionEntriesTop: convertEntriesToHTML(video.descriptionEntriesTop)
  };
}

/* Create variables for createThematic and updateThematic mutations */
const createVariablesForThematicMutation = thematic => ({
  identifier: 'survey',
  titleEntries: thematic.titleEntries,
  // If thematic.img.externalUrl is an object, it means it's a File.
  // We need to send image: null if we didn't change the image.
  image: thematic.img && typeof thematic.img.externalUrl === 'object' ? thematic.img.externalUrl : null,
  // if video is null, pass {} to remove all video fields on server side
  video: thematic.video === null ? {} : convertVideoDescriptionsToHTML(thematic.video),
  questions: thematic.questions
});

const createVariablesForDeleteThematicMutation = thematic => ({
  thematicId: thematic.id
});

const createVariablesForResourceMutation = resource => ({
  doc: resource.doc && typeof resource.doc.externalUrl === 'object' ? resource.doc.externalUrl : null,
  embedCode: resource.embedCode,
  image: resource.img && typeof resource.img.externalUrl === 'object' ? resource.img.externalUrl : null,
  textEntries: convertEntriesToHTML(resource.textEntries),
  titleEntries: resource.titleEntries
});

const createVariablesForDeleteResourceMutation = resource => ({ resourceId: resource.id });

const createVariablesForSectionMutation = section => ({
  type: section.type,
  url: section.url,
  order: section.order,
  titleEntries: section.titleEntries
});

const createVariablesForDeleteSectionMutation = section => ({ sectionId: section.id });

const SaveButton = ({
  i18n,
  client,
  createThematic,
  deleteThematic,
  thematicsHaveChanged,
  refetchThematics,
  thematics,
  updateThematic,
  updateDiscussionPreference,
  preferences,
  languagePreferenceHasChanged,
  resetLanguagePreferenceChanged,
  changeLocale,
  resourcesHaveChanged,
  resources,
  legalNoticeAndTerms,
  createResource,
  deleteResource,
  updateResource,
  refetchResources,
  resourcesCenterPage,
  updateResourcesCenter,
  updateLegalNoticeAndTerms,
  refetchResourcesCenter,
  refetchTabsConditions,
  sections,
  sectionsHaveChanged,
  refetchSections,
  createSection,
  updateSection,
  deleteSection,
  refetchLegalNoticeAndTerms
}) => {
  const saveAction = () => {
    displayAlert('success', `${I18n.t('loading.wait')}...`);
    if (languagePreferenceHasChanged) {
      // Save and update the apolloStore
      const payload = {
        variables: {
          languages: preferences
        }
      };
      // updateDiscussionPreference(payload);
      updateDiscussionPreference(payload).then(() => {
        client.query({
          query: getDiscussionPreferenceLanguage,
          variables: {
            inLocale: i18n.locale
          },
          fetchPolicy: 'network-only'
        });
        displayAlert('success', I18n.t('administration.successLanguagePreference'));
        changeLocale(i18n.locale);
      });
      resetLanguagePreferenceChanged();
    }

    if (thematicsHaveChanged) {
      const mutationsPromises = getMutationsPromises({
        items: thematics,
        variablesCreator: createVariablesForThematicMutation,
        deleteVariablesCreator: createVariablesForDeleteThematicMutation,
        createMutation: createThematic,
        deleteMutation: deleteThematic,
        updateMutation: updateThematic
      });

      runSerial(mutationsPromises)
        .then(() => {
          refetchThematics();
          displayAlert('success', I18n.t('administration.successThemeCreation'));
        })
        .catch((error) => {
          displayAlert('danger', error, false, 30000);
        });
    }

    if (resourcesCenterPage.get('hasChanged')) {
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

    if (sectionsHaveChanged) {
      const mutationsPromises = getMutationsPromises({
        items: sections,
        variablesCreator: createVariablesForSectionMutation,
        deleteVariablesCreator: createVariablesForDeleteSectionMutation,
        createMutation: createSection,
        updateMutation: updateSection,
        deleteMutation: deleteSection
      });

      runSerial(mutationsPromises).then(() => {
        refetchSections();
        displayAlert('success', I18n.t('administration.sections.successSave'));
      });
    }

    if (legalNoticeAndTerms.get('hasChanged')) {
      const legalNoticeEntries = legalNoticeAndTerms.get('legalNoticeEntries').toJS();
      const termsAndConditionsEntries = legalNoticeAndTerms.get('termsAndConditionsEntries').toJS();
      const payload = {
        variables: {
          legalNoticeEntries: convertEntriesToHTML(legalNoticeEntries),
          termsAndConditionsEntries: convertEntriesToHTML(termsAndConditionsEntries)
        }
      };
      updateLegalNoticeAndTerms(payload)
        .then(() => {
          refetchLegalNoticeAndTerms();
          displayAlert('success', I18n.t('administration.legalNoticeAndTerms.successSave'));
        })
        .catch((error) => {
          displayAlert('danger', `${error}`, false, 30000);
        });
    }
  };

  const disabled = !(
    thematicsHaveChanged ||
    languagePreferenceHasChanged ||
    resourcesHaveChanged ||
    sectionsHaveChanged ||
    resourcesCenterPage.get('hasChanged') ||
    legalNoticeAndTerms.get('hasChanged')
  );
  return (
    <Button className="button-submit button-dark right" disabled={disabled} onClick={saveAction}>
      <Translate value="administration.saveThemes" />
    </Button>
  );
};

const SaveButtonWithMutations = compose(
  graphql(createThematicMutation, {
    name: 'createThematic'
  }),
  graphql(updateThematicMutation, {
    name: 'updateThematic'
  }),
  graphql(deleteThematicMutation, {
    name: 'deleteThematic'
  }),
  graphql(updateDiscussionPreferenceQuery, {
    name: 'updateDiscussionPreference'
  }),
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
  }),
  graphql(createSectionMutation, {
    name: 'createSection'
  }),
  graphql(updateSectionMutation, {
    name: 'updateSection'
  }),
  graphql(deleteSectionMutation, {
    name: 'deleteSection'
  }),
  graphql(updateLegalNoticeAndTermsMutation, {
    name: 'updateLegalNoticeAndTerms'
  })
)(SaveButton);

const mapStateToProps = ({
  i18n,
  admin: {
    sections,
    resourcesCenter,
    thematicsById,
    thematicsHaveChanged,
    thematicsInOrder,
    discussionLanguagePreferences,
    discussionLanguagePreferencesHasChanged,
    legalNoticeAndTerms
  }
}) => {
  const { page, resourcesById, resourcesHaveChanged, resourcesInOrder } = resourcesCenter;
  const { sectionsById, sectionsHaveChanged, sectionsInOrder } = sections;
  return {
    resourcesCenterPage: page,
    resourcesHaveChanged: resourcesHaveChanged,
    resources: resourcesInOrder.map(id => resourcesById.get(id).toJS()),
    thematicsHaveChanged: thematicsHaveChanged,
    thematics: thematicsInOrder.toArray().map(id => thematicsById.get(id).toJS()),
    preferences: discussionLanguagePreferences,
    i18n: i18n,
    languagePreferenceHasChanged: discussionLanguagePreferencesHasChanged,
    sectionsHaveChanged: sectionsHaveChanged,
    sections: sectionsById
      .mapKeys((id, section) => section.set('order', sectionsInOrder.indexOf(id))) // fix order of sections
      .valueSeq() // convert to array of Map
      .toJS(), // convert to array of objects
    legalNoticeAndTerms: legalNoticeAndTerms
  };
};

const mapDispatchToProps = dispatch => ({
  resetLanguagePreferenceChanged: () => {
    dispatch(languagePreferencesHasChanged(false));
  },
  changeLocale: (newLocale) => {
    dispatch(updateSelectedLocale(newLocale));
  }
});

export default compose(connect(mapStateToProps, mapDispatchToProps), withApollo)(SaveButtonWithMutations);