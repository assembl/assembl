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
  items.forEach((item) => {
    if (item.isNew && !item.toDelete) {
      // create item
      const payload = {
        variables: variablesCreator(item)
      };
      const p1 = () => {
        return createMutation(payload);
      };
      promises.push(p1);
    } else if (item.toDelete && !item.isNew) {
      // delete item
      const payload = {
        variables: deleteVariablesCreator(item)
      };
      const p3 = () => {
        return deleteMutation(payload);
      };
      promises.push(p3);
    } else {
      // update item
      const variables = variablesCreator(item);
      variables.id = item.id;
      const payload = {
        variables: variables
      };
      const p2 = () => {
        return updateMutation(payload);
      };
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
const createVariablesForThematicMutation = (thematic) => {
  return {
    identifier: 'survey',
    titleEntries: thematic.titleEntries,
    // If thematic.img.externalUrl is an object, it means it's a File.
    // We need to send image: null if we didn't change the image.
    image: thematic.img && typeof thematic.img.externalUrl === 'object' ? thematic.img.externalUrl : null,
    // if video is null, pass {} to remove all video fields on server side
    video: thematic.video === null ? {} : convertVideoDescriptionsToHTML(thematic.video),
    questions: thematic.questions
  };
};

const createVariablesForDeleteThematicMutation = (thematic) => {
  return {
    thematicId: thematic.id
  };
};

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
  changeLocale
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
          displayAlert('danger', `${error}`, false, 30000);
        });
    }
  };

  return (
    <Button
      className="button-submit button-dark right"
      disabled={!(thematicsHaveChanged || languagePreferenceHasChanged)}
      onClick={saveAction}
    >
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
  })
)(SaveButton);

const mapStateToProps = ({
  i18n,
  admin: {
    thematicsById,
    thematicsHaveChanged,
    thematicsInOrder,
    discussionLanguagePreferences,
    discussionLanguagePreferencesHasChanged
  }
}) => {
  return {
    thematicsHaveChanged: thematicsHaveChanged,
    thematics: thematicsInOrder.toArray().map((id) => {
      return thematicsById.get(id).toJS();
    }),
    preferences: discussionLanguagePreferences,
    i18n: i18n,
    languagePreferenceHasChanged: discussionLanguagePreferencesHasChanged
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    resetLanguagePreferenceChanged: () => {
      dispatch(languagePreferencesHasChanged(false));
    },
    changeLocale: (newLocale) => {
      dispatch(updateSelectedLocale(newLocale));
    }
  };
};

export default compose(connect(mapStateToProps, mapDispatchToProps), withApollo)(SaveButtonWithMutations);