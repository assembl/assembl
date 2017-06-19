import React from 'react';
import { connect } from 'react-redux';
import { gql, graphql, withApollo, compose } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { displayAlert } from '../../utils/utilityManager';

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

const createThematic = gql`
  mutation createThematic($identifier: String!, $image: String, $titleEntries: [LangStringEntryInput]!, $questions: [QuestionInput], $video: VideoInput) {
    createThematic(identifier: $identifier, image: $image, titleEntries: $titleEntries, questions: $questions, video: $video) {
      thematic {
        title,
        imgUrl,
        video {
          title,
          description,
          htmlCode
        },
        questions {
          title
        }
      }
    }
  }
`;

const updateThematic = gql`
  mutation updateThematic($id:ID!, $identifier: String!, $image: String, $titleEntries: [LangStringEntryInput]!, $questions: [QuestionInput], $video: VideoInput) {
    updateThematic(id:$id, identifier: $identifier, image: $image, titleEntries: $titleEntries, questions: $questions, video: $video) {
      thematic {
        title,
        imgUrl,
        video {
          title,
          description,
          htmlCode
        },
        questions {
          title
        }
      }
    }
  }
`;

const deleteThematic = gql`
  mutation deleteThematic($thematicId: ID!) {
    deleteThematic(thematicId: $thematicId) {
      success
    }
  }
`;

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