import React from 'react';
import { PropTypes } from 'prop-types';
import { graphql } from 'react-apollo';
import PostCreatorQuery from '../../../graphql/PostCreatorQuery.graphql';

class PostCreator extends React.Component {
  render() {
    const { proposition } = this.props.data;
    return (
      <div className="inline">
        {proposition &&
          <div className="user">
            <span className="assembl-icon-profil grey">&nbsp;</span>
            <span className="username">
              {proposition.creator.name}
            </span>
          </div>}
      </div>
    );
  }
}

PostCreator.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    error: PropTypes.object,
    proposition: PropTypes.Array
  }).isRequired
};

const PostCreatorWithData = graphql(PostCreatorQuery)(PostCreator);

export default PostCreatorWithData;