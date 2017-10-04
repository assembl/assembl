// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Row, Col, FormGroup, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import type { RawContentState } from 'draft-js';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import uploadDocumentMutation from '../../../graphql/mutations/uploadDocument.graphql';
import { displayAlert, inviteUserToLogin } from '../../../utils/utilityManager';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { convertRawContentStateToHTML, rawContentStateIsEmpty } from '../../../utils/draftjs';
import RichTextEditor from '../../common/richTextEditor';
import attachmentsPlugin from '../../common/richTextEditor/attachmentsPlugin';
import { TEXT_AREA_MAX_LENGTH } from './topPostForm';
import { getContentLocale } from '../../../reducers/rootReducer';

type AnswerFormState = {
  body: null | RawContentState,
  submitting: boolean
};

type AnswerFormProps = {
  contentLocale: string,
  createPost: Function,
  hideAnswerForm: Function,
  hideAnswerForm: Function,
  ideaId: string,
  parentId: string,
  refetchIdea: Function,
  textareaRef: HTMLDivElement,
  uploadDocument: Function
};

class AnswerForm extends React.PureComponent<*, AnswerFormProps, AnswerFormState> {
  props: AnswerFormProps;
  state: AnswerFormState;

  constructor() {
    super();
    this.state = {
      body: null,
      submitting: false
    };
  }

  handleCancel = () => {
    this.props.hideAnswerForm();
  };

  updateBody = (newValue) => {
    this.setState({
      body: newValue
    });
  };

  handleInputFocus = () => {
    const isUserConnected = getConnectedUserId(); // TO DO put isUserConnected in the store
    if (!isUserConnected) {
      inviteUserToLogin();
    }
  };

  handleSubmit = () => {
    const { createPost, contentLocale, parentId, ideaId, refetchIdea, hideAnswerForm, uploadDocument } = this.props;
    const { body } = this.state;
    this.setState({ submitting: true });
    const bodyIsEmpty = !body || rawContentStateIsEmpty(body);
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
          body: convertRawContentStateToHTML(result.contentState),
          attachments: result.documentIds
        };
        displayAlert('success', I18n.t('loading.wait'));
        createPost({ variables: variables })
          .then(() => {
            refetchIdea().then(() => {
              hideAnswerForm();
            });
            displayAlert('success', I18n.t('debate.thread.postSuccess'));
          })
          .catch((error) => {
            displayAlert('danger', error);
            this.setState({ submitting: false });
          });
      });
    } else {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
      this.setState({ submitting: false });
    }
  };

  render() {
    const { textareaRef } = this.props;
    return (
      <Row>
        <Col xs={12} md={12}>
          <div className="color">
            <span className="assembl-icon-back-arrow" />&nbsp;<Translate value="debate.answer" />
          </div>
        </Col>
        <Col xs={12} md={12}>
          <div className="answer-form-inner">
            <FormGroup>
              <RichTextEditor
                rawContentState={this.state.body}
                handleInputFocus={this.handleInputFocus}
                maxLength={TEXT_AREA_MAX_LENGTH}
                placeholder={I18n.t('debate.insert')}
                updateContentState={this.updateBody}
                textareaRef={textareaRef}
                withAttachmentButton
              />
              <div className="button-container">
                <Button className="button-cancel button-dark btn btn-default left" onClick={this.handleCancel}>
                  <Translate value="cancel" />
                </Button>
                <Button
                  className="button-submit button-dark btn btn-default right"
                  onClick={this.handleSubmit}
                  disabled={this.state.submitting}
                >
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

const mapStateToProps = (state) => {
  return {
    contentLocale: getContentLocale(state)
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(createPostMutation, { name: 'createPost' }),
  graphql(uploadDocumentMutation, { name: 'uploadDocument' })
)(AnswerForm);