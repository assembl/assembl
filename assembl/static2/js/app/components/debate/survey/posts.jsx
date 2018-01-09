/* eslint-disable  react/no-unused-prop-types */
// @flow
import React from 'react';
import { I18n } from 'react-redux-i18n';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import type { Map } from 'immutable';

import { updateContentLocale } from '../../../actions/contentLocaleActions';
import withLoadingIndicator from '../../common/withLoadingIndicator';
import FlatList from '../../common/flatList';
import Post from './post';
import QuestionPosts from '../../../graphql/QuestionPostsQuery.graphql';
import { displayAlert } from '../../../utils/utilityManager';

type PostNode = {
  node: {
    id: string,
    originalLocale: string
  }
};

type PostsProps = {
  hasErrors: boolean,
  posts: {
    edges: Array<PostNode>
  },
  networkStatus: number,
  defaultContentLocaleMapping: Map,
  fetchMore: Function,
  refetch: Function,
  updateContentLocaleMapping: Function
};

export class DumbPosts extends React.Component<*, PostsProps, void> {
  props: PostsProps;

  componentWillMount() {
    this.updateContentLocaleMappingFromProps(this.props);
  }

  componentWillReceiveProps(nextProps: PostsProps) {
    if (nextProps.posts !== this.props.posts) {
      this.updateContentLocaleMappingFromProps(nextProps);
    }
  }

  updateContentLocaleMappingFromProps(props: PostsProps) {
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
      displayAlert('danger', I18n.t('error.loading'));
      return null;
    }
    const { networkStatus, fetchMore, refetch, posts } = this.props;
    return (
      <FlatList
        items={posts}
        ListItem={Post}
        onEndReachedThreshold={0.6}
        extractItems={entities => entities.question.posts}
        networkStatus={networkStatus}
        fetchMore={fetchMore}
        refetch={refetch}
        itemData={item => ({ id: item.node.id, originalLocale: item.node.originalLocale })}
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
  graphql(QuestionPosts, {
    options: props => ({
      variables: { first: 8, after: '', id: props.questionId }
    }),
    props: ({ data }) => {
      if (data.loading) {
        return {
          loading: true,
          networkStatus: data.networkStatus
        };
      }

      if (data.error) {
        return {
          hasErrors: true,
          networkStatus: data.networkStatus
        };
      }

      const { question: { posts }, fetchMore, refetch, networkStatus } = data;

      return {
        hasErrors: false,
        posts: posts,
        fetchMore: fetchMore,
        refetch: refetch,
        networkStatus: networkStatus
      };
    }
  }),
  withLoadingIndicator({ color: 'black' })
)(DumbPosts);