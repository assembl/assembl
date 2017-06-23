import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql, withApollo } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import { displayAlert } from '../../utils/utilityManager';
import createThematicMutation from '../../graphql/mutations/createThematic.graphql';
import deleteThematicMutation from '../../graphql/mutations/deleteThematic.graphql';
import updateThematicMutation from '../../graphql/mutations/updateThematic.graphql';

const runSerial = (tasks) => {
  let result = Promise.resolve();
  tasks.forEach((task) => {
    result = result.then(task);
  });
  return result;
};

const createVariablesForMutation = (thematic) => {
  // If imgUrl is an object, it means it's a File.
  // We need to send image: null if we didn't change the image.
  return {
    identifier: 'survey',
    titleEntries: thematic.titleEntries,
    image: typeof thematic.imgUrl === 'object' ? thematic.imgUrl : null,
    video: thematic.video === null ? {} : thematic.video, // pass {} to remove all video fields on server side
    questions: thematic.questions
  };
};

const SaveButton = ({ createThematic, deleteThematic, enabled, refetchThematics, thematics, updateThematic }) => {
  const saveAction = () => {
    displayAlert('success', `${I18n.t('loading.wait')}...`);
    const promisesArray = [];
    thematics.forEach((thematic) => {
      if (thematic.isNew && !thematic.toDelete) {
        // create thematic
        const payload = {
          variables: createVariablesForMutation(thematic)
        };
        const p1 = () => {
          return createThematic(payload);
        };
        promisesArray.push(p1);
      } else if (thematic.toDelete && !thematic.isNew) {
        // delete thematic
        const payload = {
          variables: {
            thematicId: thematic.id
          }
        };
        const p3 = () => {
          return deleteThematic(payload);
        };
        promisesArray.push(p3);
      } else {
        // update thematic
        const variables = createVariablesForMutation(thematic);
        variables.id = thematic.id;
        const payload = {
          variables: variables
        };
        const p2 = () => {
          return updateThematic(payload);
        };
        promisesArray.push(p2);
      }
    });

    runSerial(promisesArray)
      .then(() => {
        refetchThematics();
        displayAlert('success', I18n.t('administration.successThemeCreation'));
      })
      .catch((error) => {
        displayAlert('danger', `${error}`, false, 30000);
      });
  };

  return (
    <Button className="button-submit button-dark right" disabled={!enabled} onClick={saveAction}>
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
  })
)(SaveButton);

const mapStateToProps = ({ admin: { thematicsById, thematicsHaveChanged, thematicsInOrder } }) => {
  return {
    enabled: thematicsHaveChanged,
    thematics: thematicsInOrder.toArray().map((id) => {
      return thematicsById.get(id).toJS();
    })
  };
};

export default compose(connect(mapStateToProps), withApollo)(SaveButtonWithMutations);