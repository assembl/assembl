import React from 'react';
import { connect } from 'react-redux';
import { Button } from 'react-bootstrap';

import { removeQuestion, updateQuestionTitle } from '../../../actions/adminActions';
import FormControlWithLabel from '../../common/formControlWithLabel';

const QuestionsTitle = ({ titleEntries, qIndex, remove, selectedLocale, updateTitle }) => {
  const titleEntry = titleEntries.find((entry) => {
    return entry.localeCode === selectedLocale;
  });
  const title = titleEntry ? titleEntry.value : '';
  const label = `Rédaction question ${qIndex + 1}`;
  return (
    <div className="question-section">
      <FormControlWithLabel
        componentClass="textarea"
        className="text-area"
        label={label}
        value={title}
        onChange={(e) => {
          return updateTitle(e.target.value);
        }}
      />
      <div className="pointer right margin-s">
        <Button onClick={remove}>
          <span className="assembl-icon-delete grey" />
        </Button>
      </div>
    </div>
  );
};

export const mapDispatchToProps = (dispatch, { thematicId, qIndex, selectedLocale }) => {
  return {
    updateTitle: (value) => {
      return dispatch(updateQuestionTitle(thematicId, qIndex, selectedLocale, value));
    },
    remove: () => {
      return dispatch(removeQuestion(thematicId, qIndex));
    }
  };
};
export default connect(null, mapDispatchToProps)(QuestionsTitle);