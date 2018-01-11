// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate, I18n } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { Link } from 'react-router';

import withLoadingIndicator from '../components/common/withLoadingIndicator';
import Header from '../components/common/header';
import Posts from '../components/debate/survey/posts';
import Question from '../graphql/QuestionQuery.graphql';
import { displayAlert } from '../utils/utilityManager';
import { get as getRoute } from '../utils/routeMap';

type NavigationParams = {
  questionIndex: string,
  questionId: string
};

type QuestionProps = {
  hasErrors: boolean,
  title: string,
  params: NavigationParams,
  thematicTitle: string,
  thematicId: string,
  imgUrl: string,
  slug: string
};

export function DumbQuestion(props: QuestionProps) {
  if (props.hasErrors) {
    displayAlert('danger', I18n.t('error.loading'));
    return null;
  }
  const { imgUrl, title, thematicTitle, thematicId, params, slug } = props;
  const link = `${getRoute('debate', { slug: slug, phase: 'survey' })}${getRoute('theme', { themeId: thematicId })}`;
  return (
    <div className="question">
      <div className="relative">
        <Header title={thematicTitle} imgUrl={imgUrl} identifier="survey" />
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
                  <Translate value="debate.survey.proposalsTitle" />
                </h1>
              </div>
              <div className="center">
                <h3 className="collapsed-title">
                  <span>{`${params.questionIndex}/ ${title}`}</span>
                </h3>
                <Posts questionId={params.questionId} />
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

const mapStateToProps = state => ({
  lang: state.i18n.locale,
  slug: state.debate.debateData.slug
});

export default compose(
  connect(mapStateToProps),
  graphql(Question, {
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

      const { question: { thematic: { img, title, id } } } = data;

      return {
        hasErrors: false,
        loading: false,
        title: data.question.title,
        imgUrl: img.externalUrl,
        thematicTitle: title,
        thematicId: id
      };
    }
  }),
  withLoadingIndicator({ color: 'black' })
)(DumbQuestion);