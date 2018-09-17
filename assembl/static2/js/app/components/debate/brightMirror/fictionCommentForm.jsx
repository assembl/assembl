// @flow
import React, { Component } from 'react';
import { FormGroup, ControlLabel, FormControl, Button } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
// Constant import
import { EMPTY_STRING } from '../../../constants';

export type FictionCommentFormProps = {
  /** Optional comment callback when cancel is clicked */
  onCancelCommentCallback?: ?Function,
  /** Comment callback when submit is clicked */
  onSubmitCommentCallback?: ?Function
};

type LocalFictionCommentFormProps = FictionCommentFormProps;

export type FictionCommentFormState = {
  /** Comment input text */
  commentTextareaValue: string
};

const COMMENT_TEXTAREA_ID = 'comment-textarea';

class FictionCommentForm extends Component<LocalFictionCommentFormProps, FictionCommentFormState> {
  state = {
    commentTextareaValue: ''
  };

  formInputOnChangeHandler = (event: any) => {
    if (event.target.id === COMMENT_TEXTAREA_ID) {
      this.setState({ commentTextareaValue: event.target.value });
    }
  };

  formCancelHandler = () => {
    this.setState({ commentTextareaValue: EMPTY_STRING });

    const { onCancelCommentCallback } = this.props;
    if (onCancelCommentCallback) {
      onCancelCommentCallback();
    }
  };

  formSubmitHandler = () => {
    const { onSubmitCommentCallback } = this.props;
    if (onSubmitCommentCallback) {
      onSubmitCommentCallback(this.state.commentTextareaValue);
      this.setState({ commentTextareaValue: EMPTY_STRING });
    }
  };

  render() {
    const { commentTextareaValue } = this.state;

    return (
      <form>
        <FormGroup controlId={COMMENT_TEXTAREA_ID} className={COMMENT_TEXTAREA_ID}>
          <ControlLabel srOnly>{I18n.t('debate.brightMirror.commentFictionLabel')}</ControlLabel>
          <FormControl
            componentClass="textarea"
            value={commentTextareaValue}
            placeholder={I18n.t('debate.brightMirror.commentFictionPlaceholder')}
            onChange={this.formInputOnChangeHandler}
          />
        </FormGroup>
        <Button className="cancel" onClick={this.formCancelHandler}>
          {I18n.t('debate.brightMirror.commentFictionCancel')}
        </Button>
        <Button className="submit" onClick={this.formSubmitHandler} disabled={commentTextareaValue === EMPTY_STRING}>
          {I18n.t('debate.brightMirror.commentFictionSubmit')}
        </Button>
      </form>
    );
  }
}

export default FictionCommentForm;