import React from 'react';
import { connect } from 'react-redux';
import { graphql, withApollo, compose } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import { displayAlert } from '../../utils/utilityManager';
import { createThematic, updateThematic, deleteThematic } from '../../graphql/ThematicMutations';

const runSerial = (tasks) => {
  let result = Promise.resolve();
  tasks.forEach((task) => {
    result = result.then(task);
  });
  return result;
};

const createVariablesForMutation = (thematic) => {
  return {
    identifier: 'survey',
    titleEntries: thematic.titleEntries,
    image: thematic.imgUrl,
    video: thematic.video,
    questions: thematic.questions
  };
};

const SaveButton = ({ createThematic, deleteThematic, enabled, refetchThematics, thematics, updateThematic }) => {
  const saveAction = () => {
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
        displayAlert('danger', `${error}`);
      });
  };

  return (
    <Button className="button-submit button-dark right" disabled={!enabled} onClick={saveAction}>
      <Translate value="administration.saveThemes" />
    </Button>
  );
};

const SaveButtonWithMutations = compose(
  graphql(createThematic, {
    name: 'createThematic'
  }),
  graphql(updateThematic, {
    name: 'updateThematic'
  }),
  graphql(deleteThematic, {
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