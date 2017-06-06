import React from 'react';
import { gql, withApollo } from 'react-apollo';
import { FormControl } from 'react-bootstrap';

const GetThematics = gql`
{
  thematics(identifier:"survey") {
    id,
    titleEntries {
      localeCode,
      value
    },
    imgUrl,
    video {
      titleEntries {
        localeCode,
        value
      },
      descriptionEntries {
        localeCode,
        value
      },
      htmlCode
    },
    questions {
      titleEntries {
        localeCode,
        value
      }
    }
  }
}
`;

const updateTitle = (client, tIndex, qIndex, selectedLocale, titleEntryIndex, value) => {
  const thematicIndex = tIndex;
  const questionIndex = qIndex;
  const entryIndex = titleEntryIndex;

  const thematicsData = client.readQuery({ query: GetThematics });

  const newTitleEntries = {
    localeCode: selectedLocale,
    value: value,
    __typename: 'LangStringEntry'
  };

  if (entryIndex === -1) {
    thematicsData.thematics[thematicIndex].questions[questionIndex].titleEntries.push(newTitleEntries);
  } else {
    thematicsData.thematics[thematicIndex].questions[questionIndex].titleEntries.splice(entryIndex, 1, newTitleEntries);
  }

  client.writeQuery({
    query: GetThematics,
    data: thematicsData
  });
};

const QuestionsTitle = ({ client, tIndex, qIndex, titleEntries, selectedLocale }) => {
  const titleEntry = titleEntries.find((entry) => {
    return entry.localeCode === selectedLocale;
  });
  const title = titleEntry ? titleEntry.value : '';
  const titleEntryIndex = titleEntries.indexOf(titleEntry);

  const handleQuestionChange = (e) => {
    updateTitle(client, tIndex, qIndex, selectedLocale, titleEntryIndex, e.target.value);
  };

  return (
    <FormControl
      componentClass="textarea"
      className="text-area"
      value={title}
      onChange={handleQuestionChange}
    />
  );
};

export default withApollo(QuestionsTitle);