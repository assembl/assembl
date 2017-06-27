import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql } from 'react-apollo';
import { Grid } from 'react-bootstrap';
import Header from '../components/debate/common/header';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import Post from '../components/debate/thread/post';
import IdeaWithPosts from '../graphql/IdeaWithPosts.graphql';

class Idea extends React.Component {
  render() {
    const { idea } = this.props.data;
    return (
      <div className="idea">
        <Header title={idea.title} imgUrl={idea.imgUrl} />
        <section className="post-section">
          <Grid fluid className="background-light">
            <div className="max-container">
              <div className="content-section">
                {idea.posts.edges.map((edge) => {
                  return <Post {...edge.node} key={edge.node.id} />;
                })}
              </div>
            </div>
          </Grid>
        </section>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale
  };
};

export default compose(connect(mapStateToProps), graphql(IdeaWithPosts), withLoadingIndicator())(Idea);