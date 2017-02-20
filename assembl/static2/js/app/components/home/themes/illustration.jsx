import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { Glyphicon } from 'react-bootstrap';
import MapStateToProps from '../../../store/mapStateToProps';

class Illustration extends React.Component {
  render() {
    const { ideas } = this.props.ideas;
    const index = this.props.index;
    return (
      <div className="illustration illustration-box">
        <div className="image-box" style={{ backgroundImage: `url(${ideas.themes[index].imgUrl})` }}>&nbsp;</div>
        <Link className="content-box">
          <h3 className="light-title-3 center">{ideas.themes[index].title}</h3>
          <div className="stats">
            <div className="inline">{ideas.themes[index].nbPosts}</div>
            <div className="white-icon"><Glyphicon glyph="envelope" /></div>
            <div className="inline padding">-</div>
            <div className="inline">{ideas.themes[index].nbUsers}</div>
            <div className="white-icon"><Glyphicon glyph="user" /></div>
          </div>
        </Link>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default connect(MapStateToProps)(Illustration);