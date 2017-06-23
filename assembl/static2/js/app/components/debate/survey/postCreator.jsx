import React from 'react';
import { PropTypes } from 'prop-types';
import { graphql } from 'react-apollo';
import Loader from '../../common/loader';
import PostCreatorQuery from '../../../graphql/PostCreatorQuery.graphql';

class PostCreator extends React.Component {
  render() {
    const { loading, proposition } = this.props.data;
    return (
      <div className="inline">
        {loading &&
          <div className="postcreator-loader">
            <Loader textHidden color="black" />
          </div>}
        {proposition &&
          <div className="user">
            <span className="assembl-icon-profil grey">&nbsp;</span>
            <span className="username">{proposition.creator.name}</span>
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