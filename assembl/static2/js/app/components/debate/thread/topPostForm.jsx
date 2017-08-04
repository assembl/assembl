import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Row, Col, FormGroup, Button } from 'react-bootstrap';
import { I18n, Translate } from 'react-redux-i18n';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import {
  updateTopPostFormStatus,
  updateTopPostSubject,
  updateTopPostBody,
  updateTopPostSubjectRemaingChars,
  updateTopPostBodyRemaingChars
} from '../../../actions/postsActions';
import { displayAlert, inviteUserToLogin } from '../../../utils/utilityManager';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { TxtAreaWithRemainingChars } from '../../common/txtAreaWithRemainingChars';
import { TextInputWithRemainingChars } from '../../common/textInputWithRemainingChars';
import RichTextEditor from '../../common/richTextEditor';

const TEXT_INPUT_MAX_LENGTH = 140;
const TEXT_AREA_MAX_LENGTH = 3000;

const TopPostForm = ({
  ideaId,
  subject,
  updateSubject,
  body,
  updateBody,
  updateFormStatus,
  isFormActive,
  mutate,
  refetchIdea,
  subjectTopPostRemainingChars,
  updateSubjectChars,
  updateBodyChars
}) => {
  const displayForm = (isActive) => {
    return updateFormStatus(isActive);
  };

  const resetForm = () => {
    updateSubjectChars(TEXT_INPUT_MAX_LENGTH);
    updateBodyChars(TEXT_AREA_MAX_LENGTH);
    displayForm(false);
    updateSubject('');
    updateBody('');
  };

  const variables = {
    ideaId: ideaId,
    subject: subject,
    body: body
  };

  const createTopPost = () => {
    if (subject && body) {
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
    } else if (!subject) {
      displayAlert('warning', I18n.t('debate.thread.fillSubject'));
    } else if (!body) {
      displayAlert('warning', I18n.t('debate.thread.fillBody'));
    }
  };

  const handleInputFocus = () => {
    const isUserConnected = getConnectedUserId(); // TO DO put isUserConnected in the store
    if (!isUserConnected) {
      inviteUserToLogin();
    } else {
      displayForm(true);
    }
  };

  const handleSubjectChange = (e) => {
    const maxChars = TEXT_INPUT_MAX_LENGTH;
    const length = e.target.value.length;
    const remaining = maxChars - length;
    updateSubjectChars(remaining);
    updateSubject(e.target.value);
  };

  return (
    <Row>
      <Col xs={0} sm={1} md={2} />
      <Col xs={12} sm={3} md={2} className="no-padding">
        <div className="start-discussion-container">
          <div className="start-discussion-icon">
            <span className="assembl-icon-discussion color" />
          </div>
          <div className="start-discussion">
            <h3 className="dark-title-3 no-margin">
              <Translate value="debate.thread.startDiscussion" />
            </h3>
          </div>
        </div>
      </Col>
      <Col xs={12} sm={7} md={6} className="no-padding">
        <div className="form-container">
          <FormGroup>
            <TextInputWithRemainingChars
              value={subject}
              label={I18n.t('debate.subject')}
              maxLength={TEXT_INPUT_MAX_LENGTH}
              handleTxtChange={handleSubjectChange}
              handleInputFocus={handleInputFocus}
              remainingChars={subjectTopPostRemainingChars}
            />
            <div className={isFormActive ? 'margin-m' : 'hidden'}>
              <RichTextEditor
                editorState={body}
                maxLength={TEXT_AREA_MAX_LENGTH}
                placeholder={I18n.t('debate.insert')}
                updateEditorState={updateBody}
              />
              <Button className="button-cancel button-dark btn btn-default left margin-l" onClick={resetForm}>
                <Translate value="cancel" />
              </Button>
              <Button
                className="button-submit button-dark btn btn-default right margin-l"
                onClick={createTopPost}
                style={{ marginBottom: '30px' }}
              >
                <Translate value="debate.post" />
              </Button>
            </div>
          </FormGroup>
        </div>
      </Col>
      <Col xs={0} sm={1} md={2} />
    </Row>
  );
};

const mapStateToProps = ({ posts, debate }) => {
  return {
    subject: posts.topPostSubject,
    body: posts.topPostBody,
    isFormActive: posts.topPostFormStatus,
    subjectTopPostRemainingChars: posts.subjectTopPostRemainingChars,
    bodyTopPostRemainingChars: posts.bodyTopPostRemainingChars,
    slug: debate.debateData.slug
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateFormStatus: (isFormActive) => {
      return dispatch(updateTopPostFormStatus(isFormActive));
    },
    updateSubject: (subject) => {
      return dispatch(updateTopPostSubject(subject));
    },
    updateBody: (body) => {
      return dispatch(updateTopPostBody(body));
    },
    updateSubjectChars: (subjectRemainingChars) => {
      return dispatch(updateTopPostSubjectRemaingChars(subjectRemainingChars));
    },
    updateBodyChars: (bodyRemainingChars) => {
      return dispatch(updateTopPostBodyRemaingChars(bodyRemainingChars));
    }
  };
};

TopPostForm.propTypes = {
  mutate: PropTypes.func.isRequired
};

const TopPostFormWithMutation = graphql(createPostMutation)(TopPostForm);

export default connect(mapStateToProps, mapDispatchToProps)(TopPostFormWithMutation);