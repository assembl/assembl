import React from 'react';
import { connect } from 'react-redux';
import { compose, graphql, gql } from 'react-apollo';
import Header from '../components/debate/survey/header';
import withLoadingIndicator from '../components/common/withLoadingIndicator';
import Post from '../components/debate/thread/post';

class Idea extends React.Component {
  render() {
    const { idea } = this.props.data;
    return (
      <section className="survey">
        <div className="relative">
          <Header title={idea.title} imgUrl={idea.imgUrl} />
          <div>
            {idea.posts.edges.map((edge) => {
              return <Post {...edge.node} />;
            })}
          </div>
        </div>
      </section>
    );
  }
}

const IdeaWithPostsByIdeaQuery = gql`
  query PostsByIdeaQuery($lang: String!, $id: ID!) {
    idea: node(id:$id) {
      ... on Idea {
        id
        title(lang: $lang)
        description(lang: $lang)
        imgUrl
        posts(first: 20) {
          edges {
            node {
              ... on Post { subject body }
            }
          }
        }
      }
    }
  }
`;

const mapStateToProps = (state) => {
  return {
    lang: state.i18n.locale
  };
};

export default compose(connect(mapStateToProps), graphql(IdeaWithPostsByIdeaQuery), withLoadingIndicator())(Idea);