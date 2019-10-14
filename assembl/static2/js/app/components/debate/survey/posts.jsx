/* eslint-disable  react/no-unused-prop-types */
// @flow
import * as React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import type { Map } from 'immutable';

import { updateContentLocale } from '../../../actions/contentLocaleActions';
import manageErrorAndLoading from '../../common/manageErrorAndLoading';
import FlatList from '../../common/flatList';
import Post from './post';
import QuestionPosts from '../../../graphql/QuestionPostsQuery.graphql';

type PostNode = {
  node: {
    id: string,
    originalLocale: string
  }
};

type Props = {
  isModerating: boolean,
  posts: {
    edges: Array<PostNode>
  },
  params: Object,
  networkStatus: number,
  defaultContentLocaleMapping: Map,
  identifier: string,
  isPhaseCompleted: boolean,
  fetchMore: Function,
  refetch: Function,
  questionId: string,
  questionIndex: string,
  themeId: string,
  updateContentLocaleMapping: Function
};

export class DumbPosts extends React.Component<Props> {
  componentWillMount() {
    this.updateContentLocaleMappingFromProps(this.props);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.posts !== this.props.posts) {
      this.updateContentLocaleMappingFromProps(nextProps);
    }
  }

  updateContentLocaleMappingFromProps(props: Props) {
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
    const { isModerating, networkStatus, params, fetchMore, refetch, themeId, posts, questionId, isPhaseCompleted } = this.props;
    return (
      <FlatList
        items={posts}
        ListItem={Post}
        onEndReachedThreshold={0.6}
        extractItems={entities => entities.question.posts}
        networkStatus={networkStatus}
        fetchMore={fetchMore}
        refetch={refetch}
        loadPreviousMessage="debate.survey.loadRecentPosts"
        itemData={item => ({
          id: item.node.id,
          isPhaseCompleted: isPhaseCompleted,
          isModerating: isModerating,
          originalLocale: item.node.originalLocale,
          identifier: params.phase,
          questionId: questionId,
          questionIndex: params.questionIndex,
          themeId: themeId
        })}
      />
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
  withRouter,
  graphql(QuestionPosts, {
    options: (props) => {
      const { hash } = props.location;
      let id = null;
      if (hash !== '') {
        id = hash.replace('#', '').split('?')[0];
      }
      return {
        variables: {
          first: 8,
          after: '',
          id: props.questionId,
          fromNode: id,
          hashtags: props.hashtags,
          isModerating: props.isModerating,
          onlyMyPosts: props.onlyMyPosts,
          postsOrder: props.postsOrder
        }
      };
    },
    props: ({ data }) => {
      if (data.error || data.loading) {
        return {
          error: data.error,
          loading: data.loading,
          networkStatus: data.networkStatus
        };
      }

      const { question: { posts }, fetchMore, refetch, networkStatus } = data;
      return {
        error: data.error,
        loading: data.loading,
        posts: posts,
        fetchMore: fetchMore,
        refetch: refetch,
        networkStatus: networkStatus
      };
    }
  }),
  manageErrorAndLoading({ color: 'black', displayLoader: true })
)(DumbPosts);