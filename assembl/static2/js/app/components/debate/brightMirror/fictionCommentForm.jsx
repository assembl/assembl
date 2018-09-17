// @flow
import React, { Component } from 'react';
// import { compose, graphql } from 'react-apollo';
import { FormGroup, ControlLabel, FormControl, Button } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';
// Constant import
import { EMPTY_STRING } from '../../../constants';
// import createPostMutation from '../../../graphql/mutations/createPost.graphql';

// import { displayAlert } from '../../../utils/utilityManager';

export type FictionCommentFormProps = {
  //   contentLocale: string,
  //   ideaId: string,
  //   parentId: string,
  /** Comment callback when cancel is clicked */
  onCancelCommentCallback: ?Function,
  /** Comment callback when submit is clicked */
  onSubmitCommentCallback: ?Function
};

// export type FictionCommentFormResultType = {
//   post?: Post,
//   error: any
// };

// type FictionCommentFormGraphQLFunctions = {
//   createPost: Function
// };

type LocalFictionCommentFormProps = FictionCommentFormProps; // FictionCommentFormProps & FictionCommentFormGraphQLFunctions;

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
  };

  formSubmitHandler = () => {
    //   // const { createPost, contentLocale, parentId, ideaId, refetchIdea, hideAnswerForm, uploadDocument } = this.props;
    //   const { contentLocale, ideaId, parentId, onSubmitCommentCallback, createPost } = this.props;
    //   const { formInputValue } = this.state;
    //   // this.setState({ submitting: true });
    //   // const bodyIsEmpty = !body || editorStateIsEmpty(body);
    //   // if (formInputValue) {
    //   // first we upload the new documents
    //   // const uploadDocumentsPromise = attachmentsPlugin.uploadNewAttachments(body, uploadDocument);
    //   // uploadDocumentsPromise.then((result) => {
    //   // if (!result.contentState) {
    //   //   return;
    //   // }
    //   const variables = {
    //     contentLocale: contentLocale,
    //     ideaId: ideaId,
    //     parentId: parentId,
    //     body: formInputValue
    //     // body: convertContentStateToHTML(result.contentState)
    //     // attachments: result.documentIds
    //   };
    //   displayAlert('success', I18n.t('loading.wait'));
    //   createPost({ variables: variables })
    //     .then((result) => {
    //       // Define callback parameters
    //       const fictionCommentFormResult: FictionCommentFormResultType = {
    //         post: result.data.createPost.post,
    //         error: {}
    //       };
    //       onSubmitCommentCallback(fictionCommentFormResult);
    //       // this.setState({ submitting: false, body: EditorState.createEmpty() }, () => {
    //       // hideAnswerForm();
    //       // Execute refetchIdea after the setState otherwise we can get a
    //       // warning setState called on unmounted component.
    //       // refetchIdea().then(() => {
    //       //   // The thread may have moved because it became the latest active,
    //       //   // we need to scroll to the created post.
    //       //   // setTimeout is needed to be sure the element exist in the DOM
    //       //   setTimeout(() => {
    //       //     const createdPostElement = document.getElementById(postId);
    //       //     if (createdPostElement) {
    //       //       scrollToPost(createdPostElement, false);
    //       //     }
    //       //   });
    //       // });
    //       // });
    //       // displayAlert('success', I18n.t('debate.thread.postSuccess'));
    //     })
    //     .catch((error) => {
    //       // Define callback parameters
    //       const fictionCommentFormResult: FictionCommentFormResultType = {
    //         post: undefined,
    //         error: error
    //       };
    //       onSubmitCommentCallback(fictionCommentFormResult);
    //       // displayAlert('danger', `${error}`);
    //       // this.setState({ submitting: false });
    //     });
    //   // });
    //   // } else {
    //   //   displayAlert('warning', I18n.t('debate.thread.fillBody'));
    //   //   this.setState({ submitting: false });
    //   // }
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

// export default compose(graphql(createPostMutation, { name: 'createPost' }))(FictionCommentForm);
export default FictionCommentForm;