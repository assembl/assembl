// @flow
import * as React from 'react';
import { compose, graphql, withApollo } from 'react-apollo';
import { Row, Col, FormGroup, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { EditorState } from 'draft-js';

import uploadDocumentMutation from '../../../graphql/mutations/uploadDocument.graphql';
import updatePostMutation from '../../../graphql/mutations/updatePost.graphql';
import { displayAlert, inviteUserToLogin } from '../../../utils/utilityManager';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { convertToEditorState, convertContentStateToHTML, editorStateIsEmpty } from '../../../utils/draftjs';
import RichTextEditor from '../../common/richTextEditor';
import attachmentsPlugin from '../../common/richTextEditor/attachmentsPlugin';
import type { UploadNewAttachmentsPromiseResult } from '../../common/richTextEditor/attachmentsPlugin';
import { TextInputWithRemainingChars } from '../../common/textInputWithRemainingChars';
import { TEXT_INPUT_MAX_LENGTH, BODY_MAX_LENGTH } from './topPostForm';

type EditPostFormProps = {
  originalLocale: string,
  body: string,
  id: string,
  subject: string,
  readOnly: boolean,
  modifiedOriginalSubject: string,
  goBackToViewMode: Function,
  client: Object,
  uploadDocument: Function,
  updatePost: Function,
  onSuccess: Function,
  postSuccessMsgId?: string,
  editTitleLabelMsgId?: string,
  bodyDescriptionMsgId?: string,
  childrenUpdate?: boolean,
  bodyMaxLength?: number
};

type EditPostFormState = {
  subject: string,
  body: EditorState
};

class EditPostForm extends React.PureComponent<EditPostFormProps, EditPostFormState> {
  static defaultProps = {
    postSuccessMsgId: 'debate.thread.postSuccess',
    editTitleLabelMsgId: 'debate.edit.title',
    bodyDescriptionMsgId: 'debate.edit.body',
    childrenUpdate: true,
    bodyMaxLength: BODY_MAX_LENGTH,
    onSuccess: () => {}
  };

  constructor(props: EditPostFormProps) {
    super(props);
    const { subject } = props;
    const body = props.body || '';
    this.state = {
      body: convertToEditorState(body),
      subject: subject
    };
  }

  updateSubject = (e: SyntheticInputEvent<HTMLInputElement>): void => {
    this.setState({ subject: e.target.value });
  };

  updateBody = (rawBody: EditorState): void => {
    this.setState({ body: rawBody });
  };

  handleCancel = (): void => {
    this.props.goBackToViewMode();
  };

  handleInputFocus = () => {
    const isUserConnected = getConnectedUserId(); // TO DO put isUserConnected in the store
    if (!isUserConnected) {
      inviteUserToLogin();
    }
  };

  handleSubmit = (): void => {
    const { uploadDocument, updatePost, postSuccessMsgId, childrenUpdate } = this.props;
    const { body } = this.state;
    const subjectIsEmpty = this.state.subject && this.state.subject.length === 0;
    const bodyIsEmpty = editorStateIsEmpty(body);
    if (!subjectIsEmpty && !bodyIsEmpty) {
      // first we upload the new documents
      const uploadDocumentsPromise = attachmentsPlugin.uploadNewAttachments(body, uploadDocument);
      uploadDocumentsPromise.then((result: UploadNewAttachmentsPromiseResult) => {
        if (!result.contentState) {
          return;
        }

        const variables = {
          contentLocale: this.props.originalLocale,
          postId: this.props.id,
          subject: this.state.subject || '',
          body: convertContentStateToHTML(result.contentState),
          attachments: result.documentIds
        };
        displayAlert('success', I18n.t('loading.wait'));
        const oldSubject = this.props.subject;
        updatePost({ variables: variables })
          .then(() => {
            displayAlert('success', I18n.t(postSuccessMsgId));
            this.props.goBackToViewMode();
            this.props.onSuccess(variables.subject, variables.body);
            if (childrenUpdate && oldSubject !== this.state.subject) {
              // If we edited the subject, we need to reload all descendants posts,
              // we do this by refetch all Post queries.
              // Descendants are actually a subset of Post queries, so we overfetch here.
              // This is fine, editing a subject should be a rare action.
              const queryManager = this.props.client.queryManager;
              queryManager.queryIdsByName.Post.forEach((queryId) => {
                queryManager.observableQueries[queryId].observableQuery.refetch();
              });
            }
          })
          .catch((error) => {
            displayAlert('danger', `${error}`);
          });
      });
    } else if (subjectIsEmpty) {
      displayAlert('warning', I18n.t('debate.thread.fillSubject'));
    } else if (bodyIsEmpty) {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
    }
  };

  render() {
    return (
      <Row>
        <Col xs={12} md={12}>
          <div className="color margin-left-9">
            <span className="assembl-icon-edit" />&nbsp;<Translate value={this.props.editTitleLabelMsgId} className="sm-title" />
          </div>
        </Col>
        <Col xs={12} md={12}>
          <div className="answer-form-inner">
            {this.props.readOnly ? (
              <div>
                <h3 className="dark-title-3">{this.props.modifiedOriginalSubject}</h3>
                <div className="margin-m" />
              </div>
            ) : (
              <TextInputWithRemainingChars
                alwaysDisplayLabel
                label={I18n.t('debate.edit.subject')}
                value={this.state.subject}
                handleTxtChange={this.updateSubject}
                maxLength={TEXT_INPUT_MAX_LENGTH}
              />
            )}
            <FormGroup>
              <RichTextEditor
                editorState={this.state.body}
                placeholder={I18n.t(this.props.bodyDescriptionMsgId)}
                onChange={this.updateBody}
                maxLength={this.props.bodyMaxLength}
                withAttachmentButton
              />

              <div className="button-container">
                <Button className="button-cancel button-dark btn btn-default left" onClick={this.handleCancel}>
                  <Translate value="cancel" />
                </Button>
                <Button className="button-submit button-dark btn btn-default right" onClick={this.handleSubmit}>
                  <Translate value="debate.post" />
                </Button>
              </div>
            </FormGroup>
          </div>
        </Col>
      </Row>
    );
  }
}

export default compose(
  graphql(uploadDocumentMutation, { name: 'uploadDocument' }),
  graphql(updatePostMutation, { name: 'updatePost' }),
  withApollo
)(EditPostForm);