import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import { Row, Col, FormGroup, Button } from 'react-bootstrap';
import { Translate, I18n } from 'react-redux-i18n';

import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import { updateAnswerPostBody, updateAnswerPostBodyRemaingChars, updateActiveAnswerFormId } from '../../../actions/postsActions';
import { displayAlert, inviteUserToLogin } from '../../../utils/utilityManager';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { TxtAreaWithRemainingChars } from '../../common/txtAreaWithRemainingChars';

const TEXT_AREA_MAX_LENGTH = 3000;
const TEXT_AREA_ROWS = 10;

const AnswerForm = ({
  body,
  bodyRemainingChars,
  mutate,
  updateBody,
  updateBodyChars,
  parentId,
  ideaId,
  refetchIdea,
  hideAnswerForm
}) => {
  const handleBodyChange = (e) => {
    const maxChars = TEXT_AREA_MAX_LENGTH;
    const length = e.target.value.length;
    const remaining = maxChars - length;
    updateBodyChars(remaining);
    updateBody(e.target.value);
  };

  const resetForm = () => {
    hideAnswerForm();
    updateBodyChars(TEXT_AREA_MAX_LENGTH);
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
        <div className="color"><span className="assembl-icon-back-arrow" />&nbsp;<Translate value="debate.answer" /></div>
      </Col>
      <Col xs={12} md={12} className="margin-m">
        <FormGroup>
          <TxtAreaWithRemainingChars
            value={body}
            label={I18n.t('debate.insert')}
            maxLength={TEXT_AREA_MAX_LENGTH}
            rows={TEXT_AREA_ROWS}
            handleTxtChange={handleBodyChange}
            handleInputFocus={handleInputFocus}
            remainingChars={bodyRemainingChars}
          />
          <Button className="button-cancel button-dark btn btn-default left margin-l" onClick={resetForm}>
            <Translate value="cancel" />
          </Button>
          <Button className="button-submit button-dark btn btn-default right margin-l" onClick={answerPost}>
            <Translate value="debate.post" />
          </Button>
        </FormGroup>
      </Col>
    </Row>
  );
};

const mapStateToProps = ({ posts, debate }) => {
  return {
    body: posts.answerPostBody,
    bodyRemainingChars: posts.bodyAnswerPostRemainingChars,
    slug: debate.debateData.slug
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateBody: (body) => {
      return dispatch(updateAnswerPostBody(body));
    },
    updateBodyChars: (bodyRemainingChars) => {
      return dispatch(updateAnswerPostBodyRemaingChars(bodyRemainingChars));
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