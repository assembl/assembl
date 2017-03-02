import React from 'react';
import { connect } from 'react-redux';
import MapStateToProps from '../../../store/mapStateToProps';
import MapDispatchToProps from '../../../store/mapDispatchToProps';

class Statistic extends React.Component {
  render() {
    const { ideas } = this.props.ideas;
    const index = this.props.index;

    return (
      <div className="stats">
        <div className="stat-nb">
          <span>{ideas.latestIdeas[index].nbPosts}</span>
          <span className="glyph-white">D</span>
        </div>
        <div className="dash">-</div>
        <div className="stat-nb">
          <span>{ideas.latestIdeas[index].nbContributors}</span>
          <span className="glyph-white">A</span>
        </div>
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(Statistic);