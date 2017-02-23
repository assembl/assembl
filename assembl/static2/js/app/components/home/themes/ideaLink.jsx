import React from 'react';
import { Link } from 'react-router';
import Glyphicon from '../../common/glyphicon';

class Profile extends React.Component {
  render() {
    const { title, nbUsers, nbPosts } = this.props.idea;
    return (
      <div className="idea-link">
        <Link className="idea-link-title">{title}</Link>
        <div className="stats">
          <div className="inline">{nbPosts}</div>
          <Glyphicon glyph="message" color="white" size={20} desc="Number of contributions" />
          <div className="inline padding">-</div>
          <div className="inline">{nbUsers}</div>
          <Glyphicon glyph="avatar" color="white" size={20} desc="Number of users" />
        </div>
      </div>
    );
  }
}

export default Profile;