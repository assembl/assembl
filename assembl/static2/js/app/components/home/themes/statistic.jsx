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
        <div className="inline">{ideas.latestIdeas[index].nbPosts}</div>
        <Glyphicon glyph="message" color="white" size={20} desc="Number of contributions" />
        <div className="inline padding">-</div>
        <div className="inline">{ideas.latestIdeas[index].nbUsers}</div>
        <Glyphicon glyph="avatar" color="white" size={20} desc="Number of users" />
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(Statistic);