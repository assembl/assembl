import React from 'react';
import { Link } from 'react-router';

class Profile extends React.Component {
  render() {
    const { title, nbUsers, nbPosts } = this.props.idea;
    return (
      <div className="idea-link">
        <Link className="idea-link-title">{title}</Link>
        <div className="stats">
          <div className="inline">{nbPosts}</div>
          <span className="glyph-white">D</span>
          <div className="inline padding">-</div>
          <div className="inline">{nbUsers}</div>
          <span className="glyph-white">A</span>
        </div>
      </div>
    );
  }
}

export default Profile;