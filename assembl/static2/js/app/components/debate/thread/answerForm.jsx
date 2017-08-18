import React from 'react';
import { PropTypes } from 'prop-types';
import { graphql } from 'react-apollo';
import { Row, Col, FormGroup, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import { displayAlert, inviteUserToLogin } from '../../../utils/utilityManager';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { convertRawContentStateToHTML, rawContentStateIsEmpty } from '../../../utils/draftjs';
import RichTextEditor from '../../common/richTextEditor';
import { TEXT_AREA_MAX_LENGTH } from './topPostForm';

class AnswerForm extends React.PureComponent {
  constructor() {
    super();
    this.state = {
      body: '',
      submiting: false
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
    const { mutate, parentId, ideaId, refetchIdea, hideAnswerForm } = this.props;
    this.setState({ submiting: true });
    if (!rawContentStateIsEmpty(this.state.body)) {
      const variables = {
        ideaId: ideaId,
        parentId: parentId,
        body: convertRawContentStateToHTML(this.state.body)
      };
      displayAlert('success', I18n.t('loading.wait'));
      mutate({ variables: variables })
        .then(() => {
          refetchIdea();
          displayAlert('success', I18n.t('debate.thread.postSuccess'));
          hideAnswerForm();
        })
        .catch((error) => {
          displayAlert('danger', error);
          this.setState({ submiting: false });
        });
    } else {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
      this.setState({ submiting: false });
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
              />
              <div className="button-container">
                <Button className="button-cancel button-dark btn btn-default left" onClick={this.handleCancel}>
                  <Translate value="cancel" />
                </Button>
                <Button
                  className="button-submit button-dark btn btn-default right"
                  onClick={this.handleSubmit}
                  disabled={this.state.submiting}
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

AnswerForm.propTypes = {
  mutate: PropTypes.func.isRequired
};

export default graphql(createPostMutation)(AnswerForm);