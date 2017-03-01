import React from 'react';
import { connect } from 'react-redux';
import Glyphicon from '../../common/glyphicon';
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
          <Glyphicon glyph="message" color="white" size={20} desc="Number of contributions" />
        </div>
        <div className="dash">-</div>
        <div className="stat-nb">
          <span>{ideas.latestIdeas[index].nbContributors}</span>
          <Glyphicon glyph="avatar" color="white" size={20} desc="Number of users" />
        </div>
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(Statistic);