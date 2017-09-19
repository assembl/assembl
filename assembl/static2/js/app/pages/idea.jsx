import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { Grid } from 'react-bootstrap';

import Header from '../components/debate/common/header';
import IdeaQuery from '../graphql/IdeaQuery.graphql';
import IdeaWithPostsQuery from '../graphql/IdeaWithPostsQuery.graphql';
import InfiniteSeparator from '../components/common/infiniteSeparator';
import Post, { PostFolded } from '../components/debate/thread/post';
import GoUp from '../components/common/goUp';
import Tree from '../components/common/tree';
import Loader from '../components/common/loader';
import Permissions, { connectedUserCan } from '../utils/permissions';
import { getConnectedUserId } from '../utils/globalFunctions';
import Announcement from './../components/debate/thread/announcement';
import TopPostForm from '../components/debate/thread/topPostForm';
import { getContentLocale } from '../reducers/rootReducer';

export const transformPosts = (edges, additionnalProps = {}) => {
  const postsByParent = {};
  edges.forEach((e) => {
    const p = { ...e.node, ...additionnalProps };
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
  render() {
    const { contentLocale, lang, ideaData, ideaWithPostsData, routerParams, debateData } = this.props;
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
      transformPosts(ideaWithPostsData.idea.posts.edges, {
        refetchIdea: refetchIdea,
        ideaId: idea.id,
        routerParams: routerParams,
        debateData: debateData
      });

    const isUserConnected = getConnectedUserId();
    return (
      <div className="idea">
        <Header title={idea.title} longTitle={idea.longTitle} imgUrl={idea.imgUrl} identifier="thread" />
        <section className="post-section">
          {!ideaWithPostsData.loading &&
            idea.announcementBody &&
            <Grid fluid className="background-grey">
              <div className="max-container">
                <div className="content-section">
                  <Announcement ideaWithPostsData={ideaWithPostsData} announcementBody={idea.announcementBody} />
                </div>
              </div>
            </Grid>}
          {!isUserConnected || connectedUserCan(Permissions.ADD_POST)
            ? <Grid fluid className="background-color">
              <div className="max-container">
                <div className="top-post-form">
                  <TopPostForm ideaId={idea.id} refetchIdea={refetchIdea} />
                </div>
              </div>
            </Grid>
            : null}
          <Grid fluid className="background-grey">
            <div className="max-container">
              <div className="content-section">
                {ideaWithPostsData.loading
                  ? <Loader />
                  : <Tree
                    contentLocale={contentLocale}
                    lang={lang}
                    data={topPosts}
                    InnerComponent={Post}
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
    lang: state.i18n.locale,
    contentLocale: getContentLocale(state),
    debateData: state.debate.debateData
  };
};

export default compose(
  connect(mapStateToProps),
  graphql(IdeaWithPostsQuery, { name: 'ideaWithPostsData' }),
  graphql(IdeaQuery, { name: 'ideaData' })
)(Idea);