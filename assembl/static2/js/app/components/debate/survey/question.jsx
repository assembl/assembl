import React from 'react';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, Button } from 'react-bootstrap';

import { getConnectedUserId } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import { inviteUserToLogin, displayAlert } from '../../../utils/utilityManager';
import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import { SMALL_SCREEN_WIDTH } from '../../../constants';
import { withScreenDimensions } from '../../common/screenDimensions';
import TextAreaWithRemainingChars from '../../common/textAreaWithRemainingChars';

const MINIMUM_BODY_LENGTH = 10;

class Question extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonDisabled: false,
      postBody: ''
    };
    this.getProposalText = this.getProposalText.bind(this);
    this.createPost = this.createPost.bind(this);
    this.redirectToLogin = this.redirectToLogin.bind(this);
  }

  getProposalText(e) {
    const txtValue = e.currentTarget.value;
    this.setState({
      postBody: txtValue
    });
  }

  createPost() {
    const { contentLocale, questionId, scrollToQuestion, index, refetchTheme } = this.props;
    const body = this.state.postBody;
    this.setState({ buttonDisabled: true }, () =>
      this.props
        .mutate({ variables: { contentLocale: contentLocale, ideaId: questionId, body: body } })
        .then(() => {
          scrollToQuestion(true, index + 1);
          displayAlert('success', I18n.t('debate.survey.postSuccess'));
          refetchTheme();
          this.setState({
            postBody: '',
            buttonDisabled: false
          });
        })
        .catch((error) => {
          displayAlert('danger', error);
          this.setState({
            buttonDisabled: false
          });
        })
    );
  }

  redirectToLogin() {
    const isUserConnected = getConnectedUserId();
    const { scrollToQuestion, index } = this.props;
    if (!isUserConnected) {
      inviteUserToLogin();
    } else {
      scrollToQuestion(true, index);
    }
  }

  render() {
    const { index, title, screenWidth, screenHeight } = this.props;
    const height = screenHeight - document.getElementById('timeline').clientHeight;
    const { debateData } = this.props.debate;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
    return (
      <section
        className={isPhaseCompleted ? 'hidden' : 'questions-section'}
        id={`q${index}`}
        style={screenWidth >= SMALL_SCREEN_WIDTH ? { height: height } : { height: '100%' }}
      >
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="question-title">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">{`${index}/ ${title}`}</h1>
            </div>
            <Col xs={12} md={9} className="col-centered">
              <TextAreaWithRemainingChars
                domId={`txt${index}`}
                onChange={this.getProposalText}
                onClick={this.redirectToLogin}
                placeholder={I18n.t('debate.survey.txtAreaPh')}
                value={this.state.postBody}
              />
              {this.state.postBody.length > MINIMUM_BODY_LENGTH && (
                <Button
                  onClick={this.createPost}
                  disabled={this.state.buttonDisabled}
                  className="button-submit button-dark right margin-l clear"
                >
                  <Translate value="debate.survey.submit" />
                </Button>
              )}
            </Col>
          </div>
        </Grid>
      </section>
    );
  }
}

const mapStateToProps = state => ({
  debate: state.debate,
  contentLocale: state.i18n.locale
});

export default compose(connect(mapStateToProps), graphql(createPostMutation), withScreenDimensions)(Question);