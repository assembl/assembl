import React from 'react';
import { connect } from 'react-redux';
import { gql, graphql, withApollo, compose } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { displayAlert } from '../../utils/utilityManager';

const GetThematics = gql`
{
  thematics(identifier:"survey") {
    id,
    titleEntries {
      localeCode,
      value
    }
  }
}
`;

const createLanguageEntries = (titles) => {
  return titles.map((title) => {
    return { value: title.value, localeCode: title.localeCode };
  });
};

const SaveButton = ({ client, createThematic, updateThematic, deleteThematic, thematicsToDelete }) => {
  const saveAction = () => {
    const thematicsData = client.readQuery({ query: GetThematics });
    let promisesArray = [];
    thematicsData.thematics.forEach((t) => {
      if (t.id < 0) {
        const p1 = createThematic({
          variables: {
            identifier: 'survey',
            titleEntries: createLanguageEntries(t.titleEntries),
            image: t.image
          }
        });
        promisesArray.push(p1);
      } else {
        const p2 = updateThematic({
          variables: {
            id: t.id,
            identifier: 'survey',
            titleEntries: createLanguageEntries(t.titleEntries)
          }
        });
        promisesArray.push(p2);
      }
    });
    if (thematicsToDelete.length > 0) {
      thematicsToDelete.forEach((id) => {
        const p3 = deleteThematic({
          variables: {
            thematicId: id
          }
        })
        promisesArray.push(p3);
      });
    }
    Promise.all(promisesArray).then(() => { 
      displayAlert('success', I18n.t('administration.successThemeCreation'));
    }).catch((error) => { 
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
  mutation createThematic($identifier: String!, $image: String, $titleEntries: [LangStringEntryInput]!) {
    createThematic(identifier: $identifier, image: $image, titleEntries: $titleEntries) {
      thematic {
        title,
        imgUrl
      }
    }
  }
`;

const updateThematic = gql`
  mutation updateThematic($id:ID!, $identifier: String!, $titleEntries: [LangStringEntryInput]!) {
    updateThematic(id:$id, identifier: $identifier, titleEntries: $titleEntries) {
      thematic {
        title,
        imgUrl
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
    thematicsToDelete : state.admin.thematicsToDelete
  };
};

export default connect(mapStateToProps)(withApollo(SaveButtonWithMutations));