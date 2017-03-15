import React from 'react';

class Statistic extends React.Component {
  render() {
    const nbPosts = this.props.nbPosts;
    const nbContributors = this.props.nbContributors;
    return (
      <div className="stats">
        <div className="stat-nb">
          <span>{nbPosts}</span>
          <span className="assembl-icon-message white">&nbsp;</span>
        </div>
        <div className="dash">-</div>
        <div className="stat-nb">
          <span>{nbContributors}</span>
          <span className="assembl-icon-profil white">&nbsp;</span>
        </div>
      </div>
    );
  }
}

export default Statistic;