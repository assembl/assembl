// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Row, Col, FormGroup, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';
import type { RawContentState } from 'draft-js';
import classNames from 'classnames';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import uploadDocumentMutation from '../../../graphql/mutations/uploadDocument.graphql';
import { displayAlert, displayModal, promptForLoginOr } from '../../../utils/utilityManager';
import { convertRawContentStateToHTML, rawContentStateIsEmpty } from '../../../utils/draftjs';
import RichTextEditor from '../../common/richTextEditor';
import attachmentsPlugin from '../../common/richTextEditor/attachmentsPlugin';
import { TEXT_AREA_MAX_LENGTH } from '../common/topPostForm';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';

type AnswerFormProps = {
  contentLocale: string,
  createPost: Function,
  hideAnswerForm: Function,
  ideaId: string,
  parentId: string,
  refetchIdea: Function,
  textareaRef: HTMLDivElement,
  uploadDocument: Function,
  debateData: Object,
  identifier: string,
  handleAnswerClick: Function
};

type AnswerFormState = {
  body: null | RawContentState,
  submitting: boolean
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
    const { hideAnswerForm } = this.props;
    this.setState({ body: null }, hideAnswerForm);
  };

  updateBody = (newValue) => {
    this.setState({
      body: newValue
    });
  };

  handleInputFocus = () => {
    const { debateData, identifier, handleAnswerClick } = this.props;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, identifier);
    if (isPhaseCompleted) {
      const body = (
        <div>
          <Translate value="debate.noAnswer" />
        </div>
      );
      displayModal(null, body, true, null, null, true);
    } else {
      promptForLoginOr(handleAnswerClick)();
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
              this.setState({ body: null }, hideAnswerForm);
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

  getClassNames() {
    const { submitting } = this.state;
    return classNames(['button-submit', 'button-dark', 'btn', 'btn-default', 'right', submitting && 'cursor-wait']);
  }

  render() {
    const { textareaRef } = this.props;
    return (
      <Row>
        <Col xs={12} md={12}>
          <div className="answer-form-inner">
            <FormGroup>
              <RichTextEditor
                rawContentState={this.state.body}
                handleInputFocus={this.handleInputFocus}
                maxLength={TEXT_AREA_MAX_LENGTH}
                placeholder={I18n.t('debate.toAnswer')}
                updateContentState={this.updateBody}
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
      </Row>
    );
  }
}

const mapStateToProps = state => ({
  contentLocale: state.i18n.locale,
  debateData: state.debate.debateData
});

export default compose(
  connect(mapStateToProps),
  graphql(createPostMutation, { name: 'createPost' }),
  graphql(uploadDocumentMutation, { name: 'uploadDocument' })
)(AnswerForm);