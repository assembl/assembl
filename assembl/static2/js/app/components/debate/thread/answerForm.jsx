// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Row, Col, FormGroup, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import { EditorState } from 'draft-js';
import classNames from 'classnames';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import uploadDocumentMutation from '../../../graphql/mutations/uploadDocument.graphql';
import { displayAlert, promptForLoginOr } from '../../../utils/utilityManager';
import { convertContentStateToHTML, editorStateIsEmpty } from '../../../utils/draftjs';
import RichTextEditor from '../../common/richTextEditor';
import attachmentsPlugin from '../../common/richTextEditor/attachmentsPlugin';
import { BODY_MAX_LENGTH } from '../common/topPostForm';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import { scrollToPost } from '../../../utils/hashLinkScroll';

type AnswerFormProps = {
  contentLocale: string,
  createPost: Function,
  hideAnswerForm: Function,
  ideaId: string,
  parentId: string,
  refetchIdea: Function,
  textareaRef: Function,
  uploadDocument: Function,
  timeline: Timeline,
  identifier: string,
  handleAnswerClick: Function
};

type AnswerFormState = {
  body: EditorState,
  submitting: boolean,
  isHidden: boolean
};

class AnswerForm extends React.PureComponent<AnswerFormProps, AnswerFormState> {
  constructor() {
    super();
    this.state = {
      body: EditorState.createEmpty(),
      submitting: false,
      isHidden: false
    };
  }

  componentWillMount() {
    const { identifier, timeline } = this.props;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(timeline, identifier);
    if (isPhaseCompleted) this.setState({ isHidden: true });
  }

  handleCancel = () => {
    const { hideAnswerForm } = this.props;
    this.setState({ body: EditorState.createEmpty() }, hideAnswerForm);
  };

  updateBody = (newValue) => {
    this.setState({
      body: newValue
    });
  };

  handleInputFocus = () => {
    const { handleAnswerClick } = this.props;
    promptForLoginOr(handleAnswerClick)();
  };

  handleSubmit = () => {
    const { createPost, contentLocale, parentId, ideaId, refetchIdea, hideAnswerForm, uploadDocument } = this.props;
    const { body } = this.state;
    this.setState({ submitting: true });
    const bodyIsEmpty = !body || editorStateIsEmpty(body);
    if (!bodyIsEmpty) {
      // first we upload the new documents
      const uploadDocumentsPromise = attachmentsPlugin.uploadNewAttachments(body, uploadDocument);
      uploadDocumentsPromise.then((result) => {
        if (!result.contentState) {
          return;
        }

        const variables = {
          contentLocale: contentLocale,
          ideaId: ideaId,
          parentId: parentId,
          body: convertContentStateToHTML(result.contentState),
          attachments: result.documentIds
        };
        displayAlert('success', I18n.t('loading.wait'));
        createPost({ variables: variables })
          .then((res) => {
            const postId = res.data.createPost.post.id;
            this.setState({ submitting: false, body: EditorState.createEmpty() }, () => {
              hideAnswerForm();
              // Execute refetchIdea after the setState otherwise we can get a
              // warning setState called on unmounted component.
              refetchIdea().then(() => {
                // The thread may have moved because it became the latest active,
                // we need to scroll to the created post.
                // setTimeout is needed to be sure the element exist in the DOM
                setTimeout(() => {
                  const createdPostElement = document.getElementById(postId);
                  if (createdPostElement) {
                    scrollToPost(createdPostElement, false);
                  }
                });
              });
            });
            displayAlert('success', I18n.t('debate.thread.postSuccess'));
          })
          .catch((error) => {
            displayAlert('danger', `${error}`);
            this.setState({ submitting: false });
          });
      });
    } else {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
      this.setState({ submitting: false });
    }
  };

  getClassNames() {
    const { submitting } = this.state;
    return classNames(['button-submit', 'button-dark', 'btn', 'btn-default', 'right', submitting && 'cursor-wait']);
  }

  render() {
    const { textareaRef } = this.props;
    const { isHidden } = this.state;
    return (
      <Row>
        {!isHidden ? (
          <Col xs={12} md={12}>
            <div className="answer-form-inner">
              <FormGroup>
                <RichTextEditor
                  editorState={this.state.body}
                  handleInputFocus={this.handleInputFocus}
                  maxLength={BODY_MAX_LENGTH}
                  placeholder={I18n.t('debate.toAnswer')}
                  onChange={this.updateBody}
                  textareaRef={textareaRef}
                  withAttachmentButton
                />
                <div className="button-container">
                  <Button className="button-cancel button-dark btn btn-default left" onClick={this.handleCancel}>
                    <Translate value="cancel" />
                  </Button>
                  <Button className={this.getClassNames()} onClick={this.handleSubmit} disabled={this.state.submitting}>
                    <Translate value="debate.post" />
                  </Button>
                </div>
              </FormGroup>
            </div>
          </Col>
        ) : null}
      </Row>
    );
  }
}

const mapStateToProps = state => ({
  contentLocale: state.i18n.locale,
  timeline: state.timeline
});

export default compose(
  connect(mapStateToProps),
  graphql(createPostMutation, { name: 'createPost' }),
  graphql(uploadDocumentMutation, { name: 'uploadDocument' })
)(AnswerForm);