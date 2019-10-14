// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { Link } from 'react-router';

import manageErrorAndLoading from '../components/common/manageErrorAndLoading';
import Header from '../components/common/header';
import Posts from '../components/debate/survey/posts';
import Question from '../graphql/QuestionQuery.graphql';
import { get as getRoute } from '../utils/routeMap';
import HeaderStatistics, { statContributions, statMessages, statParticipants } from '../components/common/headerStatistics';
import { getIsPhaseCompletedById } from '../utils/timeline';
import QuestionPostsFilterMenu from '../components/debate/common/postsFilter/question/menu';

type NavigationParams = {
  questionIndex: string,
  questionId: string,
  phase: string,
  slug: string
};

export type Props = {
  imgUrl: string,
  isModerating: boolean,
  numContributors: number,
  numPosts: number,
  params: NavigationParams,
  phaseId: string,
  questionFilter: PostsFilterState,
  thematicId: string,
  thematicTitle: string,
  title: string,
  timeline: Timeline,
  totalSentiments: number
};

export class DumbQuestion extends React.Component<Props> {
  static defaultProps = {
    isModerating: false
  };

  render() {
    const {
      isModerating,
      phaseId,
      imgUrl,
      timeline,
      title,
      numContributors,
      numPosts,
      thematicTitle,
      thematicId,
      params,
      params: { phase, slug },
      totalSentiments
    } = this.props;
    const link = `${getRoute('idea', { slug: slug, phase: phase, phaseId: phaseId, themeId: thematicId })}`;
    const numContributions = numPosts + totalSentiments;
    const statElements = [statMessages(numPosts), statContributions(numContributions), statParticipants(numContributors)];
    const isPhaseCompleted = getIsPhaseCompletedById(timeline, phaseId);
    return (
      <div className="question">
        <div className="relative">
          <Header title={thematicTitle} imgUrl={imgUrl} phaseId={phaseId}>
            <HeaderStatistics statElements={statElements} />
          </Header>
          <QuestionPostsFilterMenu stickyOffset={600} stickyTopPosition={100} />
          <div className="background-light proposals">
            <Grid fluid className="background-light">
              <div className="max-container">
                <div className="margin-xl">&nbsp;</div>
                <Link to={link} className="button-diamond-dark button-submit button-dark">
                  <Translate value="debate.question.backToQuestions" />
                  <span className="button-diamond-dark-back" />
                </Link>
                <div className="question-title">
                  <div className="title-hyphen">&nbsp;</div>
                  <h1 className="dark-title-1">
                    {isModerating ? (
                      <Translate value="debate.survey.moderateProposalsTitle" />
                    ) : (
                      <Translate value="debate.survey.proposalsTitle" />
                    )}
                  </h1>
                </div>
                <div className="center">
                  <h3 className="collapsed-title">
                    <span>{`${params.questionIndex}/ ${title}`}</span>
                  </h3>
                  <Posts
                    isModerating={isModerating}
                    questionId={params.questionId}
                    themeId={thematicId}
                    isPhaseCompleted={isPhaseCompleted}
                    onlyMyPosts={this.props.questionFilter.postsFiltersStatus.onlyMyPosts}
                    postsOrder={this.props.questionFilter.postsOrderPolicy.graphqlPostsOrder}
                    hashtags={this.props.questionFilter.postsFiltersStatus.hashtags}
                  />
                  <div className="back-btn-container">
                    <Link to={link} className="button-submit button-dark">
                      <Translate value="debate.question.backToQuestions" />
                    </Link>
                  </div>
                </div>
                <div className="margin-xl">&nbsp;</div>
              </div>
            </Grid>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  timeline: state.timeline,
  questionFilter: state.questionFilter
});

export default compose(
  connect(mapStateToProps),
  graphql(Question, {
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading
        };
      }

      const { question: { numContributors, numPosts, totalSentiments, parent: { img, title, id } }, refetch } = data;

      return {
        error: data.error,
        imgUrl: img ? img.externalUrl : '',
        loading: data.loading,
        numContributors: numContributors,
        numPosts: numPosts,
        refetchQuestion: refetch,
        thematicId: id,
        thematicTitle: title,
        title: data.question.title,
        totalSentiments: totalSentiments
      };
    }
  }),
  manageErrorAndLoading({ color: 'black', displayLoader: true })
)(DumbQuestion);