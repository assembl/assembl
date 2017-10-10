import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { Grid } from 'react-bootstrap';

import { updateContentLocale } from '../actions/contentLocaleActions';
import Header from '../components/debate/common/header';
import IdeaQuery from '../graphql/IdeaQuery.graphql';
import IdeaWithPostsQuery from '../graphql/IdeaWithPostsQuery.graphql';
import InfiniteSeparator from '../components/common/infiniteSeparator';
import Post, { PostFolded } from '../components/debate/thread/post';
import ColumnsPost from '../components/debate/multiColumns/columnsPost';
import GoUp from '../components/common/goUp';
import Tree from '../components/common/tree';
import Loader from '../components/common/loader';
import Permissions, { connectedUserCan } from '../utils/permissions';
import { getConnectedUserId } from '../utils/globalFunctions';
import Announcement from './../components/debate/common/announcement';
import TopPostFormContainer from '../components/debate/common/topPostFormContainer';
import ColumnsView from '../components/debate/multiColumns/columnsView';

export const transformPosts = (edges, messageColumns, additionnalProps = {}) => {
  const postsByParent = {};
  const messageColumn = { colColor: null, colName: null };
  edges.forEach((e) => {
    messageColumns.forEach((col) => {
      if (col.messageClassifier === e.node.messageClassifier) {
        messageColumn.colColor = col.color;
        messageColumn.colName = col.name;
      }
    });
    const p = { ...e.node, ...additionnalProps, ...messageColumn };
    const items = postsByParent[p.parentId] || [];
    postsByParent[p.parentId] = items;
    items.push(p);
  });

  const getChildren = (id) => {
    return (postsByParent[id] || []).map((post) => {
      const newPost = post;
      // We modify the object in place, we are sure it's already a copy from
      // the forEach edges above.
      newPost.children = getChildren(post.id);
      return newPost;
    });
  };

  // postsByParent.null is the list of top posts
  return (postsByParent.null || []).map((p) => {
    const newPost = p;
    newPost.children = getChildren(p.id);
    return newPost;
  });
};

const noRowsRenderer = () => {
  return (
    <div className="center">
      <Translate value="debate.thread.noPostsInThread" />
    </div>
  );
};

class Idea extends React.Component {
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
      const id = hash.replace('#', '');
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
      const index = topPosts.findIndex((value) => {
        return value.id === topPostId;
      });
      if (index > -1) {
        return index;
      }
      return null;
    }
    return null;
  };

  render() {
    const { contentLocaleMapping, lang, ideaData, ideaWithPostsData, routerParams, debateData } = this.props;
    const refetchIdea = ideaWithPostsData.refetch;
    if (ideaData.loading) {
      return (
        <div className="idea">
          <Loader />
        </div>
      );
    }

    const { idea } = ideaData;

    const topPosts =
      !ideaWithPostsData.loading &&
      transformPosts(ideaWithPostsData.idea.posts.edges, ideaWithPostsData.idea.messageColumns, {
        refetchIdea: refetchIdea,
        ideaId: idea.id,
        routerParams: routerParams,
        debateData: debateData
      });

    const isUserConnected = getConnectedUserId();

    return (
      <div className="idea">
        <Header title={idea.title} synthesisTitle={idea.synthesisTitle} imgUrl={idea.imgUrl} identifier="thread" />
        <section className="post-section">
          {!ideaWithPostsData.loading &&
            idea.announcement &&
            idea.announcement.body &&
            <Grid fluid className="background-light">
              <div className="max-container">
                <div className="content-section">
                  <Announcement ideaWithPostsData={ideaWithPostsData} announcementContent={idea.announcement} />
                </div>
              </div>
            </Grid>}
          {(!isUserConnected || connectedUserCan(Permissions.ADD_POST)) && ideaWithPostsData.idea
            ? <TopPostFormContainer
              idea={idea.id}
              refetchIdea={refetchIdea}
              messageColumns={ideaWithPostsData.idea.messageColumns}
            />
            : null}
          <Grid fluid className="background-grey">
            <div className="max-container">
              <div className="content-section">
                {ideaWithPostsData.loading && <Loader />}
                {ideaWithPostsData.idea &&
                  !ideaWithPostsData.idea.messageColumns.length > 0 &&
                  <Tree
                    contentLocaleMapping={contentLocaleMapping}
                    lang={lang}
                    data={topPosts}
                    initialRowIndex={this.getInitialRowIndex(topPosts, ideaWithPostsData.idea.posts.edges)}
                    InnerComponent={Post}
                    InnerComponentFolded={PostFolded}
                    noRowsRenderer={noRowsRenderer}
                    SeparatorComponent={InfiniteSeparator}
                  />}
                {ideaWithPostsData.idea &&
                  ideaWithPostsData.idea.messageColumns.length > 0 &&
                  <ColumnsView
                    messageColumns={ideaWithPostsData.idea.messageColumns}
                    contentLocaleMapping={contentLocaleMapping}
                    lang={lang}
                    posts={topPosts}
                    initialRowIndex={this.getInitialRowIndex(topPosts, ideaWithPostsData.idea.posts.edges)}
                    InnerComponent={ColumnsPost}
                    InnerComponentFolded={PostFolded}
                    noRowsRenderer={noRowsRenderer}
                    SeparatorComponent={InfiniteSeparator}
                  />}
              </div>
            </div>
          </Grid>
        </section>
        <GoUp />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    contentLocaleMapping: state.contentLocale,
    debateData: state.debate.debateData,
    defaultContentLocaleMapping: state.defaultContentLocaleMapping,
    lang: state.i18n.locale
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateContentLocaleMapping: (info) => {
      return dispatch(updateContentLocale(info));
    }
  };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  graphql(IdeaWithPostsQuery, { name: 'ideaWithPostsData' }),
  graphql(IdeaQuery, { name: 'ideaData', options: { notifyOnNetworkStatusChange: true } })
  // ideaData.loading stays to true when switching interface language (IdeaQuery is using lang variable)
  // This is an issue in apollo-client, adding notifyOnNetworkStatusChange: true is a workaround,
  // downgrading to apollo-client 1.8.1 should works too.
  // See https://github.com/apollographql/apollo-client/issues/1186#issuecomment-327161526
)(Idea);