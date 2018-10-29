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
  rowsForTextarea?: number,
  /** Optional flag that indicates if the form should be in edit mode */
  editMode?: boolean,
  /** Optional comment value, is used when editing a comment */
  commentValue?: string
};

export type FictionCommentFormState = {
  /** Comment input text */
  commentTextareaValue: string,
  /** Flag that toggles form buttons display */
  showFormActionButtons: boolean
};

const COMMENT_TEXTAREA_ID = 'comment-textarea';
const COMMENT_CANCEL_BUTTON_ID = 'comment-cancel-button';
const COMMENT_SUBMIT_BUTTON_ID = 'comment-submit-button';

class FictionCommentForm extends Component<FictionCommentFormProps, FictionCommentFormState> {
  static defaultProps = {
    commentValue: '',
    editMode: false,
    rowsForTextarea: 2
  };

  state = {
    commentTextareaValue: this.props.commentValue ? this.props.commentValue : EMPTY_STRING,
    showFormActionButtons: this.props.editMode ? this.props.editMode : false
  };

  // Handler methods
  formInputOnChangeHandler = (event: SyntheticEvent<HTMLInputElement>) => {
    const { id, value } = event.currentTarget;
    if (id === COMMENT_TEXTAREA_ID) {
      this.setState({ commentTextareaValue: value });
    }
  };

  formCancelHandler = () => {
    const { onCancelCommentCallback } = this.props;

    this.setState(
      {
        commentTextareaValue: EMPTY_STRING,
        showFormActionButtons: false
      },
      () => {
        if (onCancelCommentCallback) {
          onCancelCommentCallback();
        }
      }
    );
  };

  formSubmitHandler = () => {
    const { onSubmitCommentCallback } = this.props;
    const { commentTextareaValue } = this.state;

    this.setState(
      {
        commentTextareaValue: EMPTY_STRING,
        showFormActionButtons: false
      },
      () => {
        if (onSubmitCommentCallback) {
          onSubmitCommentCallback(commentTextareaValue);
        }
      }
    );
  };

  focusHandler = (event: SyntheticMouseEvent<HTMLInputElement>) => {
    // Show action buttons when focus is on COMMENT_TEXTAREA_ID
    if (event.currentTarget.id === COMMENT_TEXTAREA_ID) {
      this.setState({ showFormActionButtons: true });
    }
  };

  blurHandler = (event: SyntheticMouseEvent<HTMLInputElement>) => {
    // Hide action buttons when focus is not on COMMENT_TEXTAREA_ID
    if (event.currentTarget.id === COMMENT_TEXTAREA_ID && event.relatedTarget === null) {
      this.setState({ showFormActionButtons: false });
    }
  };

  // Render methods
  renderTextArea = () => {
    const { rowsForTextarea } = this.props;
    const { commentTextareaValue } = this.state;

    return (
      <FormGroup controlId={COMMENT_TEXTAREA_ID} className={COMMENT_TEXTAREA_ID}>
        <ControlLabel srOnly>{I18n.t('debate.brightMirror.commentFiction.label')}</ControlLabel>
        {/* Use of TextareaAutosize instead of Bootstrap 3 textarea form control */}
        <TextareaAutosize
          className="form-control"
          id={COMMENT_TEXTAREA_ID}
          onChange={this.formInputOnChangeHandler}
          placeholder={I18n.t('debate.brightMirror.commentFiction.placeholder')}
          rows={rowsForTextarea}
          value={commentTextareaValue}
          onFocus={this.focusHandler}
          onBlur={this.blurHandler}
        />
      </FormGroup>
    );
  };

  // Display form action buttons only when the focus is set on the textarea
  renderActionButtons = () => {
    const { commentTextareaValue, showFormActionButtons } = this.state;

    return showFormActionButtons ? (
      <div className="comment-buttons">
        <Button id={COMMENT_CANCEL_BUTTON_ID} className="cancel" onMouseDown={this.formCancelHandler}>
          {I18n.t('debate.brightMirror.commentFiction.cancel')}
        </Button>
        <Button
          id={COMMENT_SUBMIT_BUTTON_ID}
          className="submit"
          onMouseDown={this.formSubmitHandler}
          disabled={commentTextareaValue === EMPTY_STRING}
        >
          {I18n.t('debate.brightMirror.commentFiction.submit')}
        </Button>
      </div>
    ) : null;
  };

  render() {
    return (
      <form className="comment-form">
        {this.renderTextArea()}
        {this.renderActionButtons()}
      </form>
    );
  }
}

export default FictionCommentForm;