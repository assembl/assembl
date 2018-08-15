// @flow
import * as React from 'react';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, Button } from 'react-bootstrap';
import { EditorState } from 'draft-js';

import { getConnectedUserId } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedById } from '../../../utils/timeline';
import { inviteUserToLogin, displayAlert } from '../../../utils/utilityManager';
import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import { SMALL_SCREEN_WIDTH, MINIMUM_BODY_LENGTH } from '../../../constants';
import { withScreenDimensions } from '../../common/screenDimensions';
import RichTextEditor from '../../common/richTextEditor';
import { convertEditorStateToHTML } from '../../../utils/draftjs';

type QuestionProps = {
  title: string,
  timeline: Timeline,
  contentLocale: string,
  questionId: string,
  phaseId: string,
  scrollToQuestion: Function,
  index: number,
  refetchTheme: Function,
  mutate: Function,
  screenHeight: number,
  screenWidth: number
};

type QuestionState = {
  buttonDisabled: boolean,
  postBody: EditorState
};

class Question extends React.Component<QuestionProps, QuestionState> {
  constructor(props: QuestionProps) {
    super(props);
    this.state = {
      buttonDisabled: false,
      postBody: EditorState.createEmpty()
    };
  }

  createPost = () => {
    const { contentLocale, questionId, scrollToQuestion, index, refetchTheme } = this.props;
    const body = this.state.postBody;
    this.setState({ buttonDisabled: true }, () =>
      this.props
        .mutate({ variables: { contentLocale: contentLocale, ideaId: questionId, body: convertEditorStateToHTML(body) } })
        .then(() => {
          scrollToQuestion(true, index + 1);
          displayAlert('success', I18n.t('debate.survey.postSuccess'));
          refetchTheme();
          this.setState({
            postBody: EditorState.createEmpty(),
            buttonDisabled: false
          });
        })
        .catch((error) => {
          displayAlert('danger', error.message);
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

  getPostBodyCharCount = () => {
    const { postBody } = this.state;
    if (postBody) {
      return postBody.getCurrentContent().getPlainText().length;
    }

    return 0;
  };

  render() {
    const { phaseId, index, title, screenWidth, screenHeight } = this.props;
    let height = screenHeight;
    const timelineElm = document && document.getElementById('timeline');
    // This is necessary to bypass an issue with Flow
    if (timelineElm) {
      height = screenHeight - timelineElm.clientHeight;
    }
    const { timeline } = this.props;
    const isPhaseCompleted = getIfPhaseCompletedById(timeline, phaseId);
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
                editorState={this.state.postBody}
                maxLength={1000}
                onChange={this.updateBody}
                placeHolder={I18n.t('debate.survey.txtAreaPh')}
                handleInputFocus={this.redirectToLogin}
              />
              {this.getPostBodyCharCount() > MINIMUM_BODY_LENGTH && (
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
  timeline: state.timeline,
  contentLocale: state.i18n.locale
});

export default compose(connect(mapStateToProps), graphql(createPostMutation), withScreenDimensions)(Question);