import React from 'react';
import { PropTypes } from 'prop-types';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, FormGroup, FormControl, Button } from 'react-bootstrap';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import { inviteUserToLogin, displayAlert } from '../../../utils/utilityManager';
import createPostMutation from '../../../graphql/mutations/createPost.graphql';
import { SMALL_SCREEN_WIDTH } from '../../../constants';
import { withScreenDimensions } from '../../common/screenDimensions';

class Question extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showSubmitButton: false
    };
    this.getProposalText = this.getProposalText.bind(this);
    this.createPost = this.createPost.bind(this);
    this.redirectToLogin = this.redirectToLogin.bind(this);
  }

  componentDidMount() {
    const maxChars = this.txtarea.props.maxLength;
    this.state = {
      remainingChars: maxChars
    };
  }

  componentWillReceiveProps() {
    const maxChars = this.txtarea.props.maxLength;
    this.state = {
      showSubmitButton: false,
      postBody: '',
      remainingChars: maxChars
    };
  }

  getRemainingChars(e) {
    const maxChars = this.txtarea.props.maxLength;
    const remainingChars = maxChars - e.currentTarget.value.length;
    this.setState({
      remainingChars: remainingChars
    });
  }

  getProposalText(e) {
    const txtValue = e.currentTarget.value;
    this.setState({
      postBody: txtValue
    });
  }

  displaySubmitButton(e) {
    const nbChars = e.currentTarget.value.length;
    const minAcceptableChars = 10;
    if (nbChars > minAcceptableChars) {
      this.setState({
        showSubmitButton: true
      });
    } else {
      this.setState({
        showSubmitButton: false
      });
    }
  }

  createPost() {
    const maxChars = this.txtarea.props.maxLength;
    const { contentLocale, questionId, scrollToQuestion, index, refetchTheme } = this.props;
    const body = this.state.postBody;
    this.props
      .mutate({ variables: { contentLocale: contentLocale, ideaId: questionId, body: body } })
      .then(() => {
        scrollToQuestion(true, index + 1);
        displayAlert('success', I18n.t('debate.survey.postSuccess'));
        refetchTheme();
        this.setState({
          postBody: '',
          showSubmitButton: false,
          remainingChars: maxChars
        });
      })
      .catch((error) => {
        displayAlert('danger', error);
      });
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
              <FormGroup className="no-margin">
                <FormControl
                  className="txt-area"
                  componentClass="textarea"
                  id={`txt${index}`}
                  onClick={this.redirectToLogin}
                  placeholder={I18n.t('debate.survey.txtAreaPh')}
                  onKeyUp={(e) => {
                    this.getRemainingChars(e);
                    this.displaySubmitButton(e);
                  }}
                  value={this.state.postBody}
                  maxLength={300}
                  ref={(t) => {
                    this.txtarea = t;
                  }}
                  onChange={this.getProposalText}
                />
              </FormGroup>
              <div className="annotation margin-s">
                <Translate value="debate.remaining_x_characters" nbCharacters={this.state.remainingChars} />
              </div>
              {this.state.showSubmitButton && (
                <Button onClick={this.createPost} className="button-submit button-dark right margin-l clear">
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

Question.propTypes = {
  mutate: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  debate: state.debate,
  contentLocale: state.i18n.locale
});

export default compose(connect(mapStateToProps), graphql(createPostMutation), withScreenDimensions)(Question);