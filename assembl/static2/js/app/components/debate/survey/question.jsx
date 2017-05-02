import React from 'react';
import { PropTypes } from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { connect } from 'react-redux';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid, Col, FormGroup, FormControl, Button } from 'react-bootstrap';
import { getConnectedUserId } from '../../../utils/globalFunctions';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import { displayModal, displayAlert } from '../../../utils/utilityManager';
import { getCurrentView, getContextual } from '../../../utils/routeMap';

class Question extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showSubmitButton: false
    };
    this.updateDimensions = this.updateDimensions.bind(this);
    this.getProposalText = this.getProposalText.bind(this);
    this.createPost = this.createPost.bind(this);
    this.redirectToLogin = this.redirectToLogin.bind(this);
  }
  componentDidMount() {
    const maxChars = this.txtarea.props.maxLength;
    this.state = {
      remainingChars: maxChars
    };
    this.updateDimensions();
    window.addEventListener('resize', this.updateDimensions);
  }
  componentWillReceiveProps() {
    const maxChars = this.txtarea.props.maxLength;
    this.state = {
      showSubmitButton: false,
      postBody: '',
      remainingChars: maxChars
    };
    this.updateDimensions();
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
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
  updateDimensions() {
    const screenHeight = window.innerHeight - document.getElementById('timeline').clientHeight;
    const screenWidth = window.innerWidth;
    this.setState({
      screenHeight: screenHeight,
      screenWidth: screenWidth
    });
  }
  createPost() {
    const maxChars = this.txtarea.props.maxLength;
    const { questionId, scrollToQuestion, index } = this.props;
    const body = this.state.postBody;
    this.props.mutate({ variables: { ideaId: questionId, body: body } })
    .then(() => {
      scrollToQuestion(true, index + 1);
      displayAlert('success', I18n.t('debate.survey.postSuccess'));
      this.setState({
        postBody: '',
        showSubmitButton: false,
        remainingChars: maxChars
      });
    }).catch((error) => {
      displayAlert('danger', `${error}`);
    });
  }
  redirectToLogin() {
    const isUserConnected = getConnectedUserId();
    const { scrollToQuestion, index } = this.props;
    if (!isUserConnected) {
      const next = getCurrentView();
      const slug = { slug: this.props.debate.debateData.slug };
      const body = I18n.t('debate.survey.modalBody');
      const button = { link: `${getContextual('login', slug)}?next=${next}`, label: I18n.t('debate.survey.modalFooter'), internalLink: true };
      displayModal(null, body, true, null, button, true);
    } else {
      scrollToQuestion(true, index);
    }
  }
  render() {
    const { index, title } = this.props;
    const { debateData } = this.props.debate;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
    return (
      <section
        className={isPhaseCompleted ? 'hidden' : 'questions-section'}
        id={`q${index}`}
        style={
          this.state.screenWidth >= 768 ?
            { height: this.state.screenHeight } : { height: '100%' }
        }
      >
        <Grid fluid className="background-grey">
          <div className="max-container">
            <div className="question-title">
              <div className="title-hyphen">&nbsp;</div>
              <h1 className="dark-title-1">
                {`${index}/ ${title}`}
              </h1>
            </div>
            <Col xs={12} md={9} className="col-centered">
              <FormGroup className="no-margin" controlId="formControlsTextarea">
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
                  ref={(t) => { this.txtarea = t; }}
                  onChange={this.getProposalText}
                />
              </FormGroup>
              <div className="annotation right margin-s">
                <Translate value="debate.survey.remaining_x_characters" nbCharacters={this.state.remainingChars} />
              </div>
              {this.state.showSubmitButton &&
                <Button onClick={this.createPost} className="button-submit button-dark right margin-l clear">
                  <Translate value="debate.survey.submit" />
                </Button>
              }
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

const createPostMutation = gql`
  mutation createPost($ideaId: ID!, $body: String!) {
    createPost(ideaId:$ideaId, body: $body) {
      post {
        ... on PropositionPost {
          id,
          body,
          creator {
            id,
            name
          }
        }
      }
    }
  }
`;

const QuestionWithMutation = graphql(createPostMutation)(Question);

const mapStateToProps = (state) => {
  return {
    debate: state.debate
  };
};

export default connect(mapStateToProps)(QuestionWithMutation);