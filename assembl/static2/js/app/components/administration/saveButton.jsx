import React from 'react';
import { connect } from 'react-redux';
import { gql, graphql, withApollo, compose } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { displayAlert } from '../../utils/utilityManager';

import { ThematicsQuery, ThematicQuery } from '../../graphql';

const createLanguageEntries = (titles) => {
  return titles.map((title) => {
    return { value: title.value, localeCode: title.localeCode };
  });
};

const createQuestionEntries = (questions) => {
  const questionsArray = [];
  questions.forEach((question) => {
    questionsArray.push({ titleEntries: createLanguageEntries(question.titleEntries) });
  });
  return questionsArray;
};

const createVideo = (v) => {
  const video = {
    titleEntries: v.titleEntries !== null ? createLanguageEntries(v.titleEntries) : [],
    descriptionEntries: v.descriptionEntries !== null ? createLanguageEntries(v.descriptionEntries) : [],
    htmlCode: v.htmlCode !== null ? v.htmlCode : ''
  };
  return video;
};

const runSerial = (tasks) => {
  let result = Promise.resolve();
  tasks.forEach((task) => {
    result = result.then(task);
  });
  return result;
};

const SaveButton = ({ client, createThematic, updateThematic, deleteThematic, thematicsToDelete }) => {
  const saveAction = () => {
    const { thematics } = client.readQuery({ query: ThematicsQuery });
    const promisesArray = [];
    thematics.forEach((t) => {
      // we have to use ThematicQuery to get the data that we have modified in Apollo's cache
      const data = client.readQuery({ query: ThematicQuery, variables: { id: t.id } });
      const thematic = data.thematic;
      // create a thematic if its ID is a negative number
      if (t.id < 0) {
        const payload = {
          variables: {
            identifier: 'survey',
            titleEntries: createLanguageEntries(thematic.titleEntries),
            image: thematic.imgUrl,
            video: thematic.video.length === 0 ? null : createVideo(thematic.video),
            questions: createQuestionEntries(thematic.questions)
          }
        };
        const p1 = () => {
          return createThematic(payload);
        };
        promisesArray.push(p1);
      } else {
        // Update a thematic
        const payload = {
          variables: {
            id: t.id,
            identifier: 'survey',
            titleEntries: createLanguageEntries(thematic.titleEntries),
            video: createVideo(thematic.video),
            image: typeof thematic.imgUrl === 'string' ? null : thematic.imgUrl,
            questions: createQuestionEntries(thematic.questions)
          }
        };
        const p2 = () => {
          return updateThematic(payload);
        };
        promisesArray.push(p2);
      }
    });
    // Delete a thematic
    if (thematicsToDelete.length > 0) {
      thematicsToDelete.forEach((id) => {
        if (isNaN(id)) {
          const payload = {
            variables: {
              thematicId: id
            }
          };
          const p3 = () => {
            return deleteThematic(payload);
          };
          promisesArray.push(p3);
        }
      });
    }
    runSerial(promisesArray)
      .then(() => {
        displayAlert('success', I18n.t('administration.successThemeCreation'));
      })
      .catch((error) => {
        displayAlert('danger', `${error}`);
      });
  };
  return (
    <Button className="button-submit button-dark right" onClick={saveAction}>
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

const mapStateToProps = (state) => {
  return {
    thematicsToDelete: state.admin.thematicsToDelete
  };
};

export default compose(connect(mapStateToProps), withApollo)(SaveButtonWithMutations);