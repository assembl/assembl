import React from 'react';
import { gql, withApollo } from 'react-apollo';
import { FormGroup } from 'react-bootstrap';

import QuestionTitle from './questionTitle';

const GetThematics = gql`
{
  thematics(identifier:"survey") {
    id,
    titleEntries {
      localeCode,
      value
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

const QuestionsForm = ({ client, thematicId, lang }) => {
  const thematicsData = client.readQuery({ query: GetThematics });
  const thematics = thematicsData.thematics;
  const thematic = thematics.find((t) => {
    return t.id === thematicId;
  });
  const thematicIndex = thematics.findIndex((t) => {
    return t.id === thematicId;
  });

  const questions = thematic.questions || [];

  const addQuestion = () => {
    thematicsData.thematics[thematicIndex].questions.push({
      titleEntries: [],
      __typename: 'Question'
    });
    client.writeQuery({
      query: GetThematics,
      data: thematicsData
    });
  };

  return (
    <div className="form-container">
      <div className="margin-xl">
        {questions.map((question, index) => {
          return (
            <FormGroup key={index}>
              <QuestionTitle tIndex={thematicIndex} qIndex={index} titleEntries={question.titleEntries} selectedLocale={lang} />
            </FormGroup>
          );
        })}
        <div onClick={addQuestion} className="plus margin-l">+</div>
      </div>
    </div>
  );
};

export default withApollo(QuestionsForm);