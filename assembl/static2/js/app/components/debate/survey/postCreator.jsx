import React from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import Loader from '../../common/loader';

class PostCreator extends React.Component {
  render() {
    const { loading, proposition } = this.props.data;
    return (
      <div className="inline">
        {loading && <Loader />}
        {proposition && 
          <span className="username">{proposition.creator.name}</span>
        }
      </div>
    );
  }
}

PostCreator.propTypes = {
  data: React.PropTypes.shape({
    loading: React.PropTypes.bool.isRequired,
    error: React.PropTypes.object,
    proposition: React.PropTypes.Array
  }).isRequired
};

const postCreatorQuery = gql`
  query postCreator ($id: ID!) {
    proposition: node(id: $id) {
      ... on PropositionPost {
        creator{
          name
        }
      }
    }
  }
`;

const PostCreatorWithData = graphql(postCreatorQuery)(PostCreator);

export default PostCreatorWithData;