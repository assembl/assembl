import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { Grid } from 'react-bootstrap';

import { updateContentLocale } from '../actions/contentLocaleActions';
import Header from '../components/common/header';
import IdeaQuery from '../graphql/IdeaQuery.graphql';
import IdeaWithPostsQuery from '../graphql/IdeaWithPostsQuery.graphql';
import GoUp from '../components/common/goUp';
import Loader from '../components/common/loader';
import { getConnectedUserId } from '../utils/globalFunctions';
import Announcement from './../components/debate/common/announcement';
import ColumnsView from '../components/debate/multiColumns/columnsView';
import ThreadView from '../components/debate/thread/threadView';

export const transformPosts = (edges, messageColumns, additionnalProps = {}) => {
  const postsByParent = {};

  const columns = { null: { colColor: null, colName: null } };
  messageColumns.forEach((col) => {
    columns[col.messageClassifier] = { colColor: col.color, colName: col.name };
  });

  edges.forEach((e) => {
    const p = { ...e.node, ...additionnalProps, ...columns[e.node.messageClassifier] };
    const items = postsByParent[p.parentId] || [];
    postsByParent[p.parentId] = items;
    items.push(p);
  });

  const getChildren = id =>
    (postsByParent[id] || []).map((post) => {
      const newPost = post;
      // We modify the object in place, we are sure it's already a copy from
      // the forEach edges above.
      newPost.children = getChildren(post.id);
      return newPost;
    });

  // postsByParent.null is the list of top posts
  return (postsByParent.null || []).map((p) => {
    const newPost = p;
    newPost.children = getChildren(p.id);
    return newPost;
  });
};

const noRowsRenderer = () => (
  <div className="center">
    <Translate value="debate.thread.noPostsInThread" />
  </div>
);

class Idea extends React.Component {
  constructor(props) {
    super(props);
    this.getTopPosts = this.getTopPosts.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.ideaWithPostsData.idea !== this.props.ideaWithPostsData.idea) {
      this.updateContentLocaleMappingFromProps(nextProps);
    }
  }

  updateContentLocaleMappingFromProps(props) {
    const { defaultContentLocaleMapping, ideaWithPostsData, updateContentLocaleMapping } = props;
    if (!ideaWithPostsData.loading) {
      const postsEdges = ideaWithPostsData.idea.posts.edges;
      const contentLocaleMappingData = {};
      postsEdges.forEach((edge) => {
        const post = edge.node;
        const { id, originalLocale } = post;
        const contentLocale = defaultContentLocaleMapping.get(originalLocale, originalLocale);
        contentLocaleMappingData[id] = {
          contentLocale: contentLocale,
          originalLocale: post.originalLocale
        };
      });

      updateContentLocaleMapping(contentLocaleMappingData);
    }
  }

  getInitialRowIndex = (topPosts, edges) => {
    const { hash } = window.location;
    if (hash !== '') {
      const id = hash.replace('#', '').split('?')[0];
      const allPosts = {};
      edges.forEach((e) => {
        allPosts[e.node.id] = e.node;
      });
      let post = allPosts[id];
      if (!post) {
        return null;
      }

      while (post.parentId) {
        post = allPosts[post.parentId];
      }
      const topPostId = post.id;
      const index = topPosts.findIndex(value => value.id === topPostId);
      if (index > -1) {
        return index;
      }
      return null;
    }
    return null;
  };

  getTopPosts() {
    const { ideaWithPostsData, routerParams, debateData } = this.props;
    if (!ideaWithPostsData.idea) return [];
    const topPosts = transformPosts(ideaWithPostsData.idea.posts.edges, ideaWithPostsData.idea.messageColumns, {
      refetchIdea: ideaWithPostsData.refetch,
      ideaId: ideaWithPostsData.idea.id,
      routerParams: routerParams,
      debateData: debateData
    });
    return topPosts;
  }

  render() {
    const { contentLocaleMapping, debateData, lang, ideaLoading, ideaWithPostsData, identifier } = this.props;
    const refetchIdea = ideaWithPostsData.refetch;
    if (ideaLoading) {
      return (
        <div className="idea">
          <Loader />
        </div>
      );
    }
    const { announcement, id, headerImgUrl, synthesisTitle, title } = this.props;
    const isMultiColumns = ideaWithPostsData.loading ? false : ideaWithPostsData.idea.messageViewOverride === 'messageColumns';
    const messageColumns = ideaWithPostsData.loading
      ? undefined
      : [...ideaWithPostsData.idea.messageColumns].sort((a, b) => {
        if (a.index < b.index) {
          return -1;
        }
        if (a.index > b.index) {
          return 1;
        }
        return 0;
      });
    const childProps = {
      identifier: identifier,
      debateData: debateData,
      ideaId: id,
      ideaWithPostsData: ideaWithPostsData,
      isUserConnected: getConnectedUserId(),
      contentLocaleMapping: contentLocaleMapping,
      refetchIdea: refetchIdea,
      lang: lang,
      noRowsRenderer: noRowsRenderer,
      messageColumns: messageColumns,
      posts: this.getTopPosts(),
      initialRowIndex: ideaWithPostsData.loading
        ? undefined
        : this.getInitialRowIndex(this.getTopPosts(), ideaWithPostsData.idea.posts.edges)
    };
    const view = isMultiColumns ? <ColumnsView {...childProps} /> : <ThreadView {...childProps} />;
    return (
      <div className="idea">
        <Header title={title} synthesisTitle={synthesisTitle} imgUrl={headerImgUrl} identifier={identifier} />
        <section className="post-section">
          {!ideaWithPostsData.loading &&
            announcement && (
              <Grid fluid className="background-light">
                <div className="max-container">
                  <div className="content-section">
                    <Announcement
                      ideaWithPostsData={ideaWithPostsData}
                      announcementContent={announcement}
                      isMultiColumns={isMultiColumns}
                    />
                  </div>
                </div>
              </Grid>
            )}
          {ideaWithPostsData.loading ? <Loader /> : view}
        </section>
        <GoUp />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  contentLocaleMapping: state.contentLocale,
  debateData: state.debate.debateData,
  defaultContentLocaleMapping: state.defaultContentLocaleMapping,
  lang: state.i18n.locale
});

const mapDispatchToProps = dispatch => ({
  updateContentLocaleMapping: info => dispatch(updateContentLocale(info))
});

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(IdeaWithPostsQuery, { name: 'ideaWithPostsData' }),
  graphql(IdeaQuery, {
    options: { notifyOnNetworkStatusChange: true },
    // ideaData.loading stays to true when switching interface language (IdeaQuery is using lang variable)
    // This is an issue in apollo-client, adding notifyOnNetworkStatusChange: true is a workaround,
    // downgrading to apollo-client 1.8.1 should works too.
    // See https://github.com/apollographql/apollo-client/issues/1186#issuecomment-327161526
    props: ({ data }) => {
      if (data.loading) {
        return {
          ideaLoading: true
        };
      }
      if (data.error) {
        return {
          ideaHasErrors: true
        };
      }

      return {
        announcement: data.idea.announcement,
        id: data.idea.id,
        title: data.idea.title,
        synthesisTitle: data.idea.synthesisTitle,
        headerImgUrl: data.idea.img ? data.idea.img.externalUrl : ''
      };
    }
  })
)(Idea);