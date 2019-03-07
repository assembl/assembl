// @flow
import React from 'react';

type Props = {
  numPosts: number | null,
  numContributors: number,
  numVotes: number | null
};

class Statistic extends React.PureComponent<Props> {
  render() {
    const { numPosts, numContributors, numVotes } = this.props;
    return (
      <div className="stats">
        {numPosts !== null ? (
          <div className="stat-nb">
            <span>{numPosts}</span>
            <span className="assembl-icon-message white">&nbsp;</span>
          </div>
        ) : null}
        {numVotes !== null ? (
          <div className="stat-nb">
            <span>{numVotes}</span>
            <span className="assembl-icon-participation-vote white">&nbsp;</span>
          </div>
        ) : null}
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