import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Row, Col, FormGroup, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import { updateAnswerPostBody, updateActiveAnswerFormId } from '../../../actions/postsActions';
import { displayAlert, inviteUserToLogin } from '../../../utils/utilityManager';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import RichTextEditor from '../../common/richTextEditor';

const TEXT_AREA_MAX_LENGTH = 3000;

const AnswerForm = ({ body, mutate, updateBody, parentId, ideaId, refetchIdea, hideAnswerForm, textareaRef }) => {
  const resetForm = () => {
    hideAnswerForm();
    updateBody('');
  };

  const handleInputFocus = () => {
    const isUserConnected = getConnectedUserId(); // TO DO put isUserConnected in the store
    if (!isUserConnected) {
      inviteUserToLogin();
    }
  };
  const variables = {
    ideaId: ideaId,
    parentId: parentId,
    body: body
  };

  const answerPost = () => {
    if (body) {
      displayAlert('success', I18n.t('loading.wait'));
      mutate({ variables: variables })
        .then(() => {
          refetchIdea();
          displayAlert('success', I18n.t('debate.thread.postSuccess'));
          resetForm();
        })
        .catch((error) => {
          displayAlert('danger', error);
        });
    } else {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
    }
  };
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
              editorState={body}
              handleInputFocus={handleInputFocus}
              maxLength={TEXT_AREA_MAX_LENGTH}
              placeholder={I18n.t('debate.insert')}
              updateEditorState={updateBody}
              textareaRef={textareaRef}
            />
            <div className="button-container">
              <Button className="button-cancel button-dark btn btn-default left" onClick={resetForm}>
                <Translate value="cancel" />
              </Button>
              <Button className="button-submit button-dark btn btn-default right" onClick={answerPost}>
                <Translate value="debate.post" />
              </Button>
            </div>
          </FormGroup>
        </div>
      </Col>
    </Row>
  );
};

const mapStateToProps = ({ posts, debate }) => {
  return {
    body: posts.answerPostBody,
    slug: debate.debateData.slug
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateBody: (body) => {
      return dispatch(updateAnswerPostBody(body));
    },
    hideAnswerForm: () => {
      return dispatch(updateActiveAnswerFormId(null));
    }
  };
};

AnswerForm.propTypes = {
  mutate: PropTypes.func.isRequired
};

const AnswerFormWithMutation = graphql(createPostMutation)(AnswerForm);

export default connect(mapStateToProps, mapDispatchToProps)(AnswerFormWithMutation);