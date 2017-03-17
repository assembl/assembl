import React from 'react';

class Statistic extends React.Component {
  render() {
    const { numPosts, numContributors } = this.props;
    return (
      <div className="stats">
        <div className="stat-nb">
          <span>{numPosts}</span>
          <span className="assembl-icon-message white">&nbsp;</span>
        </div>
        <div className="dash">-</div>
        <div className="stat-nb">
          <span>{numContributors}</span>
          <span className="assembl-icon-profil white">&nbsp;</span>
        </div>
      </div>
    );
  }
}

export default Statistic;