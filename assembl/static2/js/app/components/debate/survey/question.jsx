// @flow
import React from 'react';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, Button } from 'react-bootstrap';

import { getConnectedUserId } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import { inviteUserToLogin, displayAlert } from '../../../utils/utilityManager';
import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import { SMALL_SCREEN_WIDTH, MINIMUM_BODY_LENGTH } from '../../../constants';
import { withScreenDimensions } from '../../common/screenDimensions';
import RichTextEditor from '../../common/richTextEditor';
import { convertRawContentStateToHTML } from '../../../utils/draftjs';

type QuestionProps = {
  title: string,
  debate: DebateData,
  contentLocale: string,
  questionId: string,
  scrollToQuestion: Function,
  index: number,
  refetchTheme: Function,
  mutate: Function,
  screenHeight: number,
  screenWidth: number
};

type QuestionState = {
  buttonDisabled: boolean,
  postBody: string,
  charCount: number
};

class Question extends React.Component<void, QuestionProps, QuestionState> {
  props: QuestionProps;

  state: QuestionState;

  constructor(props: QuestionProps) {
    super(props);
    this.state = {
      buttonDisabled: false,
      postBody: '',
      charCount: 0
    };
  }

  createPost = () => {
    const { contentLocale, questionId, scrollToQuestion, index, refetchTheme } = this.props;
    const body = this.state.postBody;
    this.setState({ buttonDisabled: true }, () =>
      this.props
        .mutate({ variables: { contentLocale: contentLocale, ideaId: questionId, body: convertRawContentStateToHTML(body) } })
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
  };

  updateBody = (newValue) => {
    this.setState({
      postBody: newValue
    });
  };

  redirectToLogin = () => {
    const isUserConnected = getConnectedUserId();
    const { scrollToQuestion, index } = this.props;
    if (!isUserConnected) {
      inviteUserToLogin();
    } else {
      scrollToQuestion(true, index);
    }
  };

  updateCharCount = (newValue) => {
    this.setState({ charCount: newValue });
  };

  render() {
    const { index, title, screenWidth, screenHeight } = this.props;
    let height = screenHeight;
    const timeline = document && document.getElementById('timeline');
    // This is necessary to bypass an issue with Flow
    if (timeline) {
      height = screenHeight - timeline.clientHeight;
    }
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
              <h1 className="dark-title-5">{`${index}/ ${title}`}</h1>
            </div>
            <Col xs={12} md={9} className="col-centered">
              <RichTextEditor
                rawContentState={this.state.postBody}
                maxLength={1000}
                placeHolder={I18n.t('debate.survey.txtAreaPh')}
                updateContentState={this.updateBody}
                handleInputFocus={this.redirectToLogin}
                handleCharCountChange={this.updateCharCount}
              />
              {this.state.charCount > MINIMUM_BODY_LENGTH && (
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