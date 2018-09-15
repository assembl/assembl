// @flow
import React, { Component } from 'react';
import { compose, graphql } from 'react-apollo';
import { FormGroup, ControlLabel, FormControl, Button } from 'react-bootstrap';
import { I18n } from 'react-redux-i18n';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';

import { displayAlert } from '../../../utils/utilityManager';

export type FictionCommentFormProps = {
  contentLocale: string,
  ideaId: string,
  parentId: string,
  onSubmitCommentCallback: Function
};

export type FictionCommentFormResultType = {
  post?: Post,
  error: any
};

type FictionCommentFormGraphQLFunctions = {
  createPost: Function
};

type LocalFictionCommentFormProps = FictionCommentFormProps & FictionCommentFormGraphQLFunctions;

type FictionCommentFormState = {
  formInputValue: string
};

class FictionCommentForm extends Component<LocalFictionCommentFormProps, FictionCommentFormState> {
  state = {
    formInputValue: 'inital value'
  };

  formInputOnChangeHandler = (event: any) => {
    this.setState({
      formInputValue: event.target.value
    });
  };

  formSubmitHandler = () => {
    // const { createPost, contentLocale, parentId, ideaId, refetchIdea, hideAnswerForm, uploadDocument } = this.props;
    const { contentLocale, ideaId, parentId, onSubmitCommentCallback, createPost } = this.props;
    const { formInputValue } = this.state;
    // this.setState({ submitting: true });
    // const bodyIsEmpty = !body || editorStateIsEmpty(body);
    // if (formInputValue) {
    // first we upload the new documents
    // const uploadDocumentsPromise = attachmentsPlugin.uploadNewAttachments(body, uploadDocument);
    // uploadDocumentsPromise.then((result) => {
    // if (!result.contentState) {
    //   return;
    // }

    const variables = {
      contentLocale: contentLocale,
      ideaId: ideaId,
      parentId: parentId,
      body: formInputValue
      // body: convertContentStateToHTML(result.contentState)
      // attachments: result.documentIds
    };
    displayAlert('success', I18n.t('loading.wait'));
    createPost({ variables: variables })
      .then((result) => {
        // Define callback parameters
        const fictionCommentFormResult: FictionCommentFormResultType = {
          post: result.data.createPost.post,
          error: {}
        };
        onSubmitCommentCallback(fictionCommentFormResult);
        // this.setState({ submitting: false, body: EditorState.createEmpty() }, () => {
        // hideAnswerForm();
        // Execute refetchIdea after the setState otherwise we can get a
        // warning setState called on unmounted component.
        // refetchIdea().then(() => {
        //   // The thread may have moved because it became the latest active,
        //   // we need to scroll to the created post.
        //   // setTimeout is needed to be sure the element exist in the DOM
        //   setTimeout(() => {
        //     const createdPostElement = document.getElementById(postId);
        //     if (createdPostElement) {
        //       scrollToPost(createdPostElement, false);
        //     }
        //   });
        // });
        // });
        // displayAlert('success', I18n.t('debate.thread.postSuccess'));
      })
      .catch((error) => {
        // Define callback parameters
        const fictionCommentFormResult: FictionCommentFormResultType = {
          post: undefined,
          error: error
        };
        onSubmitCommentCallback(fictionCommentFormResult);
        // displayAlert('danger', `${error}`);
        // this.setState({ submitting: false });
      });
    // });
    // } else {
    //   displayAlert('warning', I18n.t('debate.thread.fillBody'));
    //   this.setState({ submitting: false });
    // }
  };

  render() {
    const { formInputValue } = this.state;

    return (
      <form>
        <FormGroup>
          <ControlLabel>Comment</ControlLabel>
          <FormControl type="text" value={formInputValue} placeholder="placeholder" onChange={this.formInputOnChangeHandler} />
        </FormGroup>

        <Button>Cancel</Button>
        <Button onClick={this.formSubmitHandler}>Submit</Button>
      </form>
    );
  }
}

export default compose(graphql(createPostMutation, { name: 'createPost' }))(FictionCommentForm);