import React from 'react';
import { connect } from 'react-redux';
import { Button, OverlayTrigger } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';

import { removeQuestion, updateQuestionTitle } from '../../../actions/adminActions';
import FormControlWithLabel from '../../common/formControlWithLabel';
import { deleteQuestionTooltip } from '../../common/tooltips';

const QuestionsTitle = ({ titleEntries, qIndex, remove, editLocale, updateTitle }) => {
  const titleEntry = titleEntries.find(entry => entry.localeCode === editLocale);
  const title = titleEntry ? titleEntry.value : '';
  const label = `${I18n.t('administration.question_label')} ${qIndex + 1} ${editLocale.toUpperCase()}`;
  return (
    <div className="question-section">
      <FormControlWithLabel
        componentClass="textarea"
        className="text-area"
        label={label}
        required
        value={title}
        onChange={e => updateTitle(e.target.value)}
      />
      <div className="pointer right margin-s">
        <OverlayTrigger placement="top" overlay={deleteQuestionTooltip}>
          <Button onClick={remove}>
            <span className="assembl-icon-delete grey" />
          </Button>
        </OverlayTrigger>
      </div>
    </div>
  );
};

export const mapDispatchToProps = (dispatch, { thematicId, qIndex, editLocale }) => ({
  updateTitle: value => dispatch(updateQuestionTitle(thematicId, qIndex, editLocale, value)),
  remove: () => dispatch(removeQuestion(thematicId, qIndex))
});
export default connect(null, mapDispatchToProps)(QuestionsTitle);