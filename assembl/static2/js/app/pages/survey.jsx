import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { browserHistory } from 'react-router';
import { Translate } from 'react-redux-i18n';
import { Grid, Button } from 'react-bootstrap';

import { updateContentLocale } from '../actions/contentLocaleActions';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import Media from '../components/common/media';
import Header from '../components/common/header';
import Question from '../components/debate/survey/question';
import Navigation from '../components/debate/survey/navigation';
import Proposals from '../components/debate/survey/proposals';
import { getIfPhaseCompletedByIdentifier } from '../utils/timeline';
import ThematicQuery from '../graphql/ThematicQuery.graphql';
import { displayAlert } from '../utils/utilityManager';

class Survey extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      moreProposals: false,
      showModal: false
    };
    this.showMoreProposals = this.showMoreProposals.bind(this);
    this.getIfProposals = this.getIfProposals.bind(this);
    this.scrollToQuestion = this.scrollToQuestion.bind(this);
  }

  componentWillMount() {
    this.updateContentLocaleMappingFromProps(this.props);
  }

  componentDidMount() {
    this.unlisten = browserHistory.listen(() => {
      this.setState({ moreProposals: false });
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data.thematic !== this.props.data.thematic) {
      this.updateContentLocaleMappingFromProps(nextProps);
    }
  }

  componentWillUnmount() {
    this.unlisten();
  }

  updateContentLocaleMappingFromProps(props) {
    const { data, defaultContentLocaleMapping, updateContentLocaleMapping } = props;
    if (!data.loading) {
      const contentLocaleMappingData = {};
      const questions = data.thematic.questions;
      questions.forEach((question) => {
        question.posts.edges.forEach((edge) => {
          const post = edge.node;
          const { id, originalLocale } = post;
          const contentLocale = defaultContentLocaleMapping.get(originalLocale, originalLocale);
          contentLocaleMappingData[id] = {
            contentLocale: contentLocale,
            originalLocale: originalLocale
          };
        });
      });

      updateContentLocaleMapping(contentLocaleMappingData);
    }
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
  scrollToQuestion(isScroll, questionIndex) {
    this.setState({
      isScroll: isScroll,
      questionIndex: questionIndex
    });
  }
  render() {
    if (this.props.data.error) {
      displayAlert('danger', 'An error occured, please reload the page');
      return null;
    }
    const { thematic: { imgUrl, questions, title, video: media } } = this.props.data;
    const { debateData } = this.props.debate;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
    return (
      <div className="survey">
        <div className="relative">
          <Header title={title} imgUrl={imgUrl} identifier="survey" />
          <Media {...media} />
          <div className="questions">
            {questions &&
              questions.map((question, index) => {
                return (
                  <Question
                    title={question.title}
                    index={index + 1}
                    key={index}
                    questionId={question.id}
                    scrollToQuestion={this.scrollToQuestion}
                    refetchTheme={this.props.data.refetch}
                  />
                );
              })}
          </div>
          {questions &&
            <Navigation
              questionsLength={questions.length}
              questionIndex={this.state.questionIndex}
              isScroll={this.state.isScroll}
              scrollToQuestion={this.scrollToQuestion}
            />}
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
                    {questions &&
                      questions.map((question, index) => {
                        return (
                          <Proposals
                            title={question.title}
                            posts={question.posts.edges}
                            moreProposals={this.state.moreProposals}
                            questionIndex={index + 1}
                            key={index}
                            refetchTheme={this.props.data.refetch}
                          />
                        );
                      })}
                    {!this.state.moreProposals &&
                      this.getIfProposals(questions) &&
                      <Button className="button-submit button-dark" onClick={this.showMoreProposals}>
                        <Translate value="debate.survey.moreProposals" />
                      </Button>}
                  </div>
                  <div className="margin-xl">&nbsp;</div>
                </div>
              </Grid>
            </section>
          </div>
        </div>
      </div>
    );
  }
}

Survey.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    thematic: PropTypes.Array
  }).isRequired
};

const mapStateToProps = (state) => {
  return {
    debate: state.debate,
    defaultContentLocaleMapping: state.defaultContentLocaleMapping,
    lang: state.i18n.locale
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateContentLocaleMapping: (data) => {
      return dispatch(updateContentLocale(data));
    }
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(ThematicQuery),
  withLoadingIndicator({ color: 'black' })
)(Survey);