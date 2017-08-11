import React from 'react';
import { connect } from 'react-redux';
import { Translate } from 'react-redux-i18n';
import { compose, graphql } from 'react-apollo';
import { Grid } from 'react-bootstrap';

import Header from '../components/debate/common/header';
import IdeaWithPosts from '../graphql/IdeaWithPosts.graphql';
import InfiniteSeparator from '../components/common/infiniteSeparator';
import Post, { PostFolded } from '../components/debate/thread/post';
import GoUp from '../components/common/goUp';
import Tree, { Child } from '../components/common/tree';
import withLoadingIndicator from '../components/common/withLoadingIndicator';

import TopPostForm from './../components/debate/thread/topPostForm';

export const transformPosts = (posts) => {
  const postsByParent = {};
  posts.forEach((p) => {
    const items = postsByParent[p.parentId] || [];
    postsByParent[p.parentId] = items;
    items.push(p);
  });

  const getChildren = (id) => {
    return (postsByParent[id] || []).map((post) => {
      return { ...post, children: getChildren(post.id) };
    });
  };

  return (postsByParent.null || []).map((p) => {
    return { ...p, children: getChildren(p.id) };
  });
};

class Idea extends React.Component {
  render() {
    const { idea } = this.props.data;
    const refetchIdea = this.props.data.refetch;
    const rawPosts = idea.posts.edges.map((e) => {
      return { ...e.node, refetchIdea: refetchIdea, ideaId: idea.id };
    });
    const posts = transformPosts(rawPosts);
    const { lang, activeAnswerFormId } = this.props;

    return (
      <div className="idea">
        <Header title={idea.title} imgUrl={idea.imgUrl} identifier="thread" />
        <section className="post-section">
          <Grid fluid className="background-color">
            <div className="max-container">
              <div className="top-post-form">
                <TopPostForm ideaId={idea.id} refetchIdea={this.props.data.refetch} />
              </div>
            </div>
          </Grid>
          <Grid fluid className="background-grey">
            <div className="max-container">
              <div className="content-section">
                <Tree
                  data={posts}
                  lang={this.props.lang}
                  ConnectedChildComponent={(props) => {
                    return <Child activeAnswerFormId={activeAnswerFormId} lang={lang} {...props} />;
                  }}
                  InnerComponent={Post}
                  InnerComponentFolded={PostFolded}
                  noRowsRenderer={() => {
                    return (
                      <div className="center">
                        <Translate value="debate.thread.noPostsInThread" />
                      </div>
                    );
                  }}
                  SeparatorComponent={InfiniteSeparator}
                />
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
    activeAnswerFormId: state.posts.activeAnswerFormId
  };
};

export default compose(connect(mapStateToProps), graphql(IdeaWithPosts), withLoadingIndicator())(Idea);