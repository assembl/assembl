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

type NavigationParams = {
  questionIndex: string,
  questionId: string,
  phase: string,
  slug: string
};

export type Props = {
  isModerating: boolean,
  phaseId: string,
  timeline: Timeline,
  title: string,
  numContributors: number,
  numPosts: number,
  params: NavigationParams,
  thematicTitle: string,
  thematicId: string,
  imgUrl: string,
  totalSentiments: number
};

export function DumbQuestion(props: Props) {
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
  } = props;
  const link = `${getRoute('idea', { slug: slug, phase: phase, phaseId: phaseId, themeId: thematicId })}`;
  let statElements = [];
  const numContributions = numPosts + totalSentiments;
  statElements = [statMessages(numPosts), statContributions(numContributions), statParticipants(numContributors)];
  const isPhaseCompleted = getIsPhaseCompletedById(timeline, phaseId);
  return (
    <div className="question">
      <div className="relative">
        <Header title={thematicTitle} imgUrl={imgUrl} phaseId={phaseId}>
          <HeaderStatistics statElements={statElements} />
        </Header>
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
                  {numPosts > 1 ? <span>{`${params.questionIndex}/ ${title}`}</span> : <span>{`${title}`}</span>}
                </h3>
                <Posts
                  isModerating={isModerating}
                  questionId={params.questionId}
                  themeId={thematicId}
                  isPhaseCompleted={isPhaseCompleted}
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

DumbQuestion.defaultProps = {
  isModerating: false
};

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  timeline: state.timeline
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

      const { question: { numContributors, numPosts, totalSentiments, parent: { img, title, id } } } = data;

      return {
        error: data.error,
        loading: data.loading,
        title: data.question.title,
        imgUrl: img ? img.externalUrl : '',
        numContributors: numContributors,
        numPosts: numPosts,
        thematicTitle: title,
        thematicId: id,
        totalSentiments: totalSentiments
      };
    }
  }),
  manageErrorAndLoading({ color: 'black', displayLoader: true })
)(DumbQuestion);