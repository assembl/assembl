import React from 'react';
import { Link } from 'react-router';
import { Glyphicon } from 'react-bootstrap';

class Profile extends React.Component {
  render() {
    const { title, nbUsers, nbPosts } = this.props.idea;
    return (
      <div className="idea-link">
        <Link className="idea-link-title">{title}</Link>
        <div className="stats">
          <div className="inline">{nbPosts}</div>
          <div className="black-icon">
            <Glyphicon glyph="envelope" />
          </div>
          <div className="inline padding">-</div>
          <div className="inline">{nbUsers}</div>
          <div className="black-icon">
            <Glyphicon glyph="user" />
          </div>
        </div>
      </div>
    );
  }
}

export default Profile;