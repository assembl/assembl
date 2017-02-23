import React from 'react';
import { connect } from 'react-redux';
import { Glyphicon } from 'react-bootstrap';
import MapStateToProps from '../../../store/mapStateToProps';
import MapDispatchToProps from '../../../store/mapDispatchToProps';

class Statistic extends React.Component {
  render() {
    const { ideas } = this.props.ideas;
    const index = this.props.index;

    return (
      <div className="stats">
        <div className="inline">{ideas.latestIdeas[index].nbPosts}</div>
        <div className="white-icon">
          <Glyphicon glyph="envelope" />
        </div>
        <div className="inline padding">-</div>
        <div className="inline">{ideas.latestIdeas[index].nbUsers}</div>
        <div className="white-icon">
          <Glyphicon glyph="user" />
        </div>
      </div>
    );
  }
}

export default connect(MapStateToProps, MapDispatchToProps)(Statistic);