// @flow
import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Translate } from 'react-redux-i18n';
import { Grid } from 'react-bootstrap';
import { Link } from 'react-router';
import type { Map } from 'immutable';

import { updateContentLocale } from '../actions/contentLocaleActions';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import Header from '../components/common/header';
import Post from '../components/debate/survey/post';
import QuestionQuery from '../graphql/QuestionQuery.graphql';
import { displayAlert } from '../utils/utilityManager';

type PostNode = {
  node: {
    id: string,
    originalLocale: string
  }
};

type NavigationParams = {
  questionIndex: string
};

type QuestionProps = {
  hasErrors: boolean,
  title: string,
  params: NavigationParams,
  thematicTitle: string,
  thematicId: string,
  imgUrl: string,
  posts: {
    edges: Array<PostNode>
  },
  slug: string,
  defaultContentLocaleMapping: Map,
  updateContentLocaleMapping: Function
};

type QuestionState = {};

class Question extends React.Component<*, QuestionProps, QuestionState> {
  props: QuestionProps;

  state: QuestionState;

  componentWillMount() {
    this.updateContentLocaleMappingFromProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.posts !== this.props.posts) {
      this.updateContentLocaleMappingFromProps(nextProps);
    }
  }

  updateContentLocaleMappingFromProps(props) {
    const { defaultContentLocaleMapping, updateContentLocaleMapping, posts } = props;
    const contentLocaleMappingData = {};
    posts.edges.forEach((edge) => {
      const post = edge.node;
      const { id, originalLocale } = post;
      const contentLocale = defaultContentLocaleMapping.get(originalLocale, originalLocale);
      contentLocaleMappingData[id] = {
        contentLocale: contentLocale,
        originalLocale: originalLocale
      };
    });

    updateContentLocaleMapping(contentLocaleMappingData);
  }

  render() {
    if (this.props.hasErrors) {
      displayAlert('danger', 'An error occured, please reload the page');
      return null;
    }
    const { imgUrl, posts, title, thematicTitle, thematicId, params, slug } = this.props;
    const link = `/${slug}/debate/survey/theme/${thematicId}`;
    return (
      <div className="question">
        <div className="relative">
          <Header title={thematicTitle} imgUrl={imgUrl} identifier="survey" />
          <div className="media-section background-light proposals">
            <Grid fluid className="background-light">
              <div className="max-container">
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
                  {posts.edges.map((post, index) => (
                    <Post id={post.node.id} originalLocale={post.node.originalLocale} postIndex={index} key={post.node.id} />
                  ))}
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
  defaultContentLocaleMapping: state.defaultContentLocaleMapping,
  lang: state.i18n.locale,
  slug: state.debate.debateData.slug
});

const mapDispatchToProps = dispatch => ({
  updateContentLocaleMapping: data => dispatch(updateContentLocale(data))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(QuestionQuery, {
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

      const { question: { posts, thematic: { img, title, id } } } = data;

      return {
        hasErrors: false,
        loading: false,
        title: data.question.title,
        imgUrl: img.externalUrl,
        thematicTitle: title,
        thematicId: id,
        posts: posts
      };
    }
  }),
  withLoadingIndicator({ color: 'black' })
)(Question);