// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import type { Map } from 'immutable';

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
import type { Timeline } from '../utils/timeline';

type PostNode = {
  node: {
    id: string,
    originalLocale: string
  }
};

type QuestionType = {
  id: string,
  posts: {
    edges: Array<PostNode>
  },
  title: string
};

type SurveyProps = {
  debate: {
    debateData: {
      timeline: Timeline
    }
  },
  defaultContentLocaleMapping: Map,
  hasErrors: boolean,
  imgUrl: string,
  loading: boolean,
  media: Object, // TODO: we should add a type for media/video and use it everywhere
  questions: Array<QuestionType>,
  refetchThematic: Function,
  title: string,
  id: string,
  slug: string,
  updateContentLocaleMapping: Function
};

type SurveyState = {
  isScroll: boolean,
  questionIndex: number | null,
  showModal: boolean
};

class Survey extends React.Component<*, SurveyProps, SurveyState> {
  props: SurveyProps;

  state: SurveyState;

  constructor(props) {
    super(props);
    this.state = {
      isScroll: false,
      showModal: false,
      questionIndex: null
    };
  }

  componentWillMount() {
    this.updateContentLocaleMappingFromProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.questions !== this.props.questions) {
      this.updateContentLocaleMappingFromProps(nextProps);
    }
  }

  updateContentLocaleMappingFromProps(props) {
    const { defaultContentLocaleMapping, updateContentLocaleMapping, questions } = props;
    const contentLocaleMappingData = {};
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

  getIfProposals = (questions) => {
    if (!questions) return false;
    let isProposals = false;
    questions.forEach((question) => {
      if (question.posts.edges.length > 0) isProposals = true;
    });
    return isProposals;
  };

  scrollToQuestion = (isScroll, questionIndex) => {
    this.setState({
      isScroll: isScroll,
      questionIndex: questionIndex
    });
  };

  render() {
    if (this.props.hasErrors) {
      displayAlert('danger', 'An error occured, please reload the page');
      return null;
    }
    const { imgUrl, media, questions, refetchThematic, title, slug } = this.props;
    const { debateData } = this.props.debate;
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, 'survey');
    const themeSlug = `/${slug}/debate/survey`;
    return (
      <div className="survey">
        <div className="relative">
          <Header title={title} imgUrl={imgUrl} identifier="survey" />
          <Media {...media} />
          <div className="questions">
            {questions &&
              questions.map((question, index) => (
                <Question
                  title={question.title}
                  index={index + 1}
                  key={index}
                  questionId={question.id}
                  scrollToQuestion={this.scrollToQuestion}
                  refetchTheme={refetchThematic}
                />
              ))}
          </div>
          {questions && (
            <Navigation
              questionsLength={questions.length}
              questionIndex={this.state.questionIndex}
              isScroll={this.state.isScroll}
              scrollToQuestion={this.scrollToQuestion}
            />
          )}
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
                      questions.map((question, index) => (
                        <Proposals
                          title={question.title}
                          posts={question.posts.edges}
                          questionIndex={index + 1}
                          questionId={question.id}
                          themeSlug={themeSlug}
                          key={index}
                          refetchTheme={refetchThematic}
                        />
                      ))}
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

const mapStateToProps = state => ({
  debate: state.debate,
  defaultContentLocaleMapping: state.defaultContentLocaleMapping,
  lang: state.i18n.locale,
  slug: state.debate.debateData.slug
});

const mapDispatchToProps = dispatch => ({
  updateContentLocaleMapping: data => dispatch(updateContentLocale(data))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(ThematicQuery, {
    props: ({ data }) => {
      if (data.loading) {
        return {
          loading: true
        };
      }

      if (data.error) {
        return {
          hasErrors: true
        };
      }

      const { thematic: { img, questions, title, video: media }, refetch } = data;

      return {
        hasErrors: false,
        imgUrl: img.externalUrl,
        loading: false,
        media: media,
        questions: questions,
        refetchThematic: refetch,
        title: title
      };
    }
  }),
  withLoadingIndicator({ color: 'black' })
)(Survey);