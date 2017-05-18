import React from 'react';
import { gql, graphql } from 'react-apollo';
import { Button } from 'react-bootstrap';
import { connect } from 'react-redux';

import { Translate } from 'react-redux-i18n';

const createLanguageEntries = (titlesByLocale) => {
  return Object.keys(titlesByLocale).map((locale) => {
    return { value: titlesByLocale[locale], localeCode: locale };
  });
};

const SaveButton = ({ mutate, themes }) => {
  const saveAction = () => {
    themes.forEach((t) => {
      mutate({
        variables: {
          identifier: 'survey',
          titleEntries: createLanguageEntries(t.titlesByLocale),
          image: t.image
        }
      }).then((res) => {
        // if res.error
        return console.log(res);
      });
    });
  };
  return (
    <Button className="button-submit button-dark right" onClick={saveAction}>
      <Translate value="administration.saveThemes" />
    </Button>
  );
};

const mapStateToProps = ({ admin }) => {
  const { surveyThemes, surveyThemesById } = admin;
  return {
    themes: surveyThemes.map((id) => {
      return surveyThemesById[id];
    })
  };
};

const SaveButtonContainer = connect(mapStateToProps)(SaveButton);

const SaveMutation = gql`
  mutation createThematic($identifier: String!, $image: String, $titleEntries: [LangStringEntryInput]!) {
    createThematic(identifier: $identifier, image: $image, titleEntries: $titleEntries) {
      thematic {
        title,
        imgUrl
      }
    }
  }
`;

export default graphql(SaveMutation)(SaveButtonContainer);