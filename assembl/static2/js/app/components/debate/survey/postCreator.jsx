import React from 'react';
import { PropTypes } from 'prop-types';

class PostCreator extends React.Component {
  render() {
    const { name } = this.props;
    return (
      <div className="inline">
        <div className="user">
          <span className="assembl-icon-profil grey">&nbsp;</span>
          <span className="username">
            {name}
          </span>
        </div>
      </div>
    );
  }
}

PostCreator.propTypes = {
  name: PropTypes.string.isRequired
};

export default PostCreator;