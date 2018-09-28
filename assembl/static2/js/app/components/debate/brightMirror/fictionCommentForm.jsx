// @flow
import React, { Component } from 'react';
import TextareaAutosize from 'react-autosize-textarea';
import { FormGroup, ControlLabel, Button } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
// Constant import
import { EMPTY_STRING } from '../../../constants';

export type FictionCommentFormProps = {
  /** Optional comment callback when cancel is clicked */
  onCancelCommentCallback?: ?Function,
  /** Comment callback when submit is clicked */
  onSubmitCommentCallback: Function,
  /** Optional rows for textarea, default set to 2 */
  rowsForTextarea?: number
};

type LocalFictionCommentFormProps = FictionCommentFormProps;

export type FictionCommentFormState = {
  /** Comment input text */
  commentTextareaValue: string,
  /** Flag that toggles form buttons display */
  showFormActionButtons: boolean
};

const COMMENT_TEXTAREA_ID = 'comment-textarea';
const COMMENT_CANCEL_BUTTON_ID = 'comment-cancel-button';
const COMMENT_SUBMIT_BUTTON_ID = 'comment-submit-button';

class FictionCommentForm extends Component<LocalFictionCommentFormProps, FictionCommentFormState> {
  static defaultProps = {
    rowsForTextarea: 2
  };

  state = {
    commentTextareaValue: '',
    showFormActionButtons: false
  };

  formInputOnChangeHandler = (event: any) => {
    if (event.target.id === COMMENT_TEXTAREA_ID) {
      this.setState({ commentTextareaValue: event.target.value });
    }
  };

  formCancelHandler = () => {
    this.setState({
      commentTextareaValue: EMPTY_STRING,
      showFormActionButtons: false
    });

    const { onCancelCommentCallback } = this.props;
    if (onCancelCommentCallback) {
      onCancelCommentCallback();
    }
  };

  formSubmitHandler = () => {
    const { onSubmitCommentCallback } = this.props;
    if (onSubmitCommentCallback) {
      onSubmitCommentCallback(this.state.commentTextareaValue);
      this.setState({
        commentTextareaValue: EMPTY_STRING,
        showFormActionButtons: false
      });
    }
  };

  focusHandler = (event: any) => {
    if (event.target.id === COMMENT_TEXTAREA_ID) {
      this.setState({ showFormActionButtons: true });
    }
  };

  blurHandler = (event: any) => {
    if (event.target.id === COMMENT_TEXTAREA_ID && event.relatedTarget === null) {
      this.setState({ showFormActionButtons: false });
    }
  };

  render() {
    const { commentTextareaValue, showFormActionButtons } = this.state;

    const textarea = (
      <FormGroup controlId={COMMENT_TEXTAREA_ID} className={COMMENT_TEXTAREA_ID}>
        <ControlLabel srOnly>{I18n.t('debate.brightMirror.commentFiction.label')}</ControlLabel>
        {/* Use of TextareaAutosize instead of Bootstrap 3 textarea form control */}
        <TextareaAutosize
          className="form-control"
          id={COMMENT_TEXTAREA_ID}
          onChange={this.formInputOnChangeHandler}
          placeholder={I18n.t('debate.brightMirror.commentFiction.placeholder')}
          rows={this.props.rowsForTextarea}
          value={commentTextareaValue}
          onFocus={this.focusHandler}
          onBlur={this.blurHandler}
        />
      </FormGroup>
    );

    // Display form action buttons only when the focus is set on the textarea
    const actionButtons = showFormActionButtons ? (
      <div className="comment-buttons">
        <Button id={COMMENT_CANCEL_BUTTON_ID} className="cancel" onClick={this.formCancelHandler}>
          {I18n.t('debate.brightMirror.commentFiction.cancel')}
        </Button>
        <Button
          id={COMMENT_SUBMIT_BUTTON_ID}
          className="submit"
          onClick={this.formSubmitHandler}
          disabled={commentTextareaValue === EMPTY_STRING}
        >
          {I18n.t('debate.brightMirror.commentFiction.submit')}
        </Button>
      </div>
    ) : null;

    return (
      <form className="comment-form">
        {textarea}
        {actionButtons}
      </form>
    );
  }
}

export default FictionCommentForm;