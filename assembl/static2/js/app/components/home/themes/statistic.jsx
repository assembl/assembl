import React from 'react';
import { connect } from 'react-redux';

class Statistic extends React.Component {
  render() {
    const { ideas } = this.props.ideas;
    const index = this.props.index;

    return (
      <div className="stats">
        <div className="stat-nb">
          <span>{ideas.latestIdeas[index].nbPosts}</span>
          <span className="assembl-icon-message white">&nbsp;</span>
        </div>
        <div className="dash">-</div>
        <div className="stat-nb">
          <span>{ideas.latestIdeas[index].nbContributors}</span>
          <span className="assembl-icon-profil white">&nbsp;</span>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    ideas: state.ideas
  };
};

export default connect(mapStateToProps)(Statistic);