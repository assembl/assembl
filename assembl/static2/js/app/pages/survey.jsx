import React from 'react';
import { connect } from 'react-redux';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { browserHistory } from 'react-router';
import { I18n, Translate } from 'react-redux-i18n';
import { Grid, Button } from 'react-bootstrap';
import Loader from '../components/common/loader';
import Video from '../components/debate/survey/video';
import Header from '../components/debate/survey/header';
import Question from '../components/debate/survey/question';
import Navigation from '../components/debate/survey/navigation';
import Proposals from '../components/debate/survey/proposals';
import { getIfPhaseCompletedByIdentifier } from '../utils/timeline';
import { getCurrentView } from '../utils/routeMap';
import { getConnectedUserId } from '../utils/globalFunctions';

class Survey extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      moreProposals: false,
      showModal: false
    };
    this.showMoreProposals = this.showMoreProposals.bind(this);
    this.getIfProposals = this.getIfProposals.bind(this);
  }
  componentWillReceiveProps() {
    this.unlisten = browserHistory.listen(() => {
      this.setState({ moreProposals: false });
    });
  }
  componentWillUnmount() {
    this.unlisten();
  }
  getIfProposals(questions) {
    this.questions = questions;
    if (!this.questions) return false;
    let isProposals = false;
    this.questions.forEach((question) => {
      if (question.posts.edges.length > 0) isProposals = true;
    });
    return isProposals;
  }
  showMoreProposals() {
    this.setState({
      moreProposals: true
    });
  }
  render() {
    const { loading, theme } = this.props.data;
    const { debateData } = this.props.debate;
    const slug = { slug: debateData.slug };
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
    const next = getCurrentView();
    return (
      <div className="survey">
        {loading && <Loader color="black" />}
        {theme &&
          <div className="relative">
            <Header title={theme.title} imgUrl={theme.imgUrl} />
            {theme.video &&
              <Video
                title={theme.video.title}
                description={theme.video.description}
                htmlCode={theme.video.htmlCode}
              />
            }
            <div className="questions">
              {theme.questions && theme.questions.map((question, index) => {
                return (
                  <Question
                    title={question.title}
                    index={index + 1}
                    key={index}
                    questionId={question.id}
                  />
                );
              })}
            </div>
            {theme.questions &&
              <Navigation questionsLength={theme.questions.length} />
            }
            <div className="proposals">
              <section className={isPhaseCompleted ? 'shown' : 'proposals-section'} id="proposals">
                <Grid fluid className="background-light">
                  <div className="max-container">
                    <div className="question-title">
                      <div className="title-hyphen">&nbsp;</div>
                      <h1 className="dark-title-1">
                        <Translate value="debate.survey.proposalsTitle" />
                      </h1>
                    </div>
                    <div className="center">
                      {theme.questions && theme.questions.map((question, index) => {
                        return (
                          <Proposals
                            title={question.title}
                            posts={question.posts.edges}
                            moreProposals={this.state.moreProposals}
                            questionIndex={index + 1}
                            key={index}
                          />
                        );
                      })}
                      {(!this.state.moreProposals && this.getIfProposals(theme.questions)) &&
                        <Button className="button-submit button-dark" onClick={this.showMoreProposals}>
                          <Translate value="debate.survey.moreProposals" />
                        </Button>
                      }
                    </div>
                    <div className="margin-xl">&nbsp;</div>
                  </div>
                </Grid>
              </section>
            </div>
          </div>
        }
      </div>
    );
  }
}

const ThemeQuery = gql`
  query ThemeQuery($lang: String!, $id: ID!) {
    theme: node(id: $id) {
      ... on Thematic {
        title(lang: $lang),
        imgUrl,
        id,
        video(lang: $lang){
          title,
          description,
          htmlCode
        }
        questions {
          ... on Question {
            title(lang: $lang),
            id,
            posts(first: 10, random: true){
              edges {
                node {
                  ... on PropositionPost {
                    id,
                    body,
                    mySentiment,
                    sentimentCounts {
                      like,
                      disagree
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

Survey.propTypes = {
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired,
    error: React.PropTypes.object,
    theme: React.PropTypes.Array
  }).isRequired
};

const SurveyWithData = graphql(ThemeQuery)(Survey);

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale,
    debate: state.debate
  };
};

export default connect(mapStateToProps)(SurveyWithData);