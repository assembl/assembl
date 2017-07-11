import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Row, Col, FormGroup, FormControl, Button } from 'react-bootstrap';
import { I18n, Translate } from 'react-redux-i18n';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import {
  updateTopPostFormStatus,
  updateTopPostSubject,
  updateTopPostBody,
  updateSubjectRemaingChars,
  updateBodyRemaingChars
} from '../../../actions/postsActions';
import { displayModal, displayAlert } from '../../../utils/utilityManager';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { getCurrentView, getContextual } from '../../../utils/routeMap';

const TEXT_INPUT_MAX_LENGTH = 140;
const TEXT_AREA_MAX_LENGTH = 3000;
const TEXT_AREA_ROWS = 12;

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
  slug,
  subjectRemainingChars,
  updateSubjectChars,
  bodyRemainingChars,
  updateBodyChars
}) => {
  const displayForm = (isActive) => {
    return updateFormStatus(isActive);
  };

  const inviteToLogin = () => {
    const isUserConnected = getConnectedUserId(); // TO DO put isUserConnected in the store
    const next = getCurrentView();
    const modalBody = I18n.t('debate.survey.modalBody');
    const button = {
      link: `${getContextual('login', slug)}?next=${next}`,
      label: I18n.t('debate.survey.modalFooter'),
      internalLink: true
    };
    if (!isUserConnected) {
      displayModal(null, modalBody, true, null, button, true);
    } else {
      displayForm(true);
    }
  };

  const emptySubject = () => {
    return updateSubject('');
  };

  const emptyBody = () => {
    return updateBody('');
  };

  const resetForm = () => {
    updateSubjectChars(TEXT_INPUT_MAX_LENGTH);
    updateBodyChars(TEXT_AREA_MAX_LENGTH);
    displayForm(false);
    emptySubject();
    emptyBody();
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
    return inviteToLogin();
  };

  const handleSubjectChange = (e) => {
    const maxChars = TEXT_INPUT_MAX_LENGTH;
    const length = e.target.value.length;
    const remaining = maxChars - length;
    updateSubjectChars(remaining);
    updateSubject(e.target.value);
  };

  const handleBodyChange = (e) => {
    const maxChars = TEXT_AREA_MAX_LENGTH;
    const length = e.target.value.length;
    const remaining = maxChars - length;
    updateBodyChars(remaining);
    updateBody(e.target.value);
  };

  return (
    <Row>
      <Col xs={0} sm={1} md={2} />
      <Col xs={12} sm={3} md={2} className="no-padding">
        <div className="start-discussion-icon">
          <span className="assembl-icon-discussion color" />
        </div>
        <div className="start-discussion">
          <h3 className="dark-title-3 no-margin">
            <Translate value="debate.thread.startDiscussion" />
          </h3>
        </div>
      </Col>
      <Col xs={12} sm={7} md={6} className="no-padding">
        <div className="form-container">
          <FormGroup>
            {subject ? <div className="form-label">{I18n.t('debate.subject')}</div> : null}
            <FormControl
              type="text"
              placeholder={I18n.t('debate.subject')}
              maxLength={TEXT_INPUT_MAX_LENGTH}
              value={subject}
              onFocus={handleInputFocus}
              onChange={handleSubjectChange}
            />
            <div className="annotation margin-xs">
              <Translate
                value="debate.remaining_x_characters"
                nbCharacters={subjectRemainingChars < 10000 ? subjectRemainingChars : TEXT_INPUT_MAX_LENGTH}
              />
            </div>
            <div className={isFormActive ? 'margin-m' : 'hidden'}>
              {body ? <div className="form-label">{I18n.t('debate.insert')}</div> : null}
              <FormControl
                className="txt-area"
                componentClass="textarea"
                placeholder={I18n.t('debate.insert')}
                maxLength={TEXT_AREA_MAX_LENGTH}
                rows={TEXT_AREA_ROWS}
                value={body}
                onChange={handleBodyChange}
              />
              <div className="annotation margin-xs">
                <Translate
                  value="debate.remaining_x_characters"
                  nbCharacters={bodyRemainingChars < 10000 ? bodyRemainingChars : TEXT_AREA_MAX_LENGTH}
                />
              </div>
              <button type="reset" className="button-cancel button-dark btn btn-default left margin-l" onClick={resetForm}>
                <Translate value="cancel" />
              </button>
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
    subjectRemainingChars: posts.subjectRemainingChars,
    bodyRemainingChars: posts.bodyRemainingChars,
    slug: debate.debateData.slug
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
    updateFormStatus: (isFormActive) => {
      return dispatch(updateTopPostFormStatus(isFormActive));
    },
    updateSubject: (topPostSubject) => {
      return dispatch(updateTopPostSubject(topPostSubject));
    },
    updateBody: (topPostBody) => {
      return dispatch(updateTopPostBody(topPostBody));
    },
    updateSubjectChars: (subjectRemainingChars) => {
      return dispatch(updateSubjectRemaingChars(subjectRemainingChars));
    },
    updateBodyChars: (bodyRemainingChars) => {
      return dispatch(updateBodyRemaingChars(bodyRemainingChars));
    }
  };
};

TopPostForm.propTypes = {
  mutate: PropTypes.func.isRequired
};

const TopPostFormWithMutation = graphql(createPostMutation)(TopPostForm);

export default connect(mapStateToProps, mapDispatchToProps)(TopPostFormWithMutation);