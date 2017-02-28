import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Glyphicon from '../../common/glyphicon';
import MapStateToProps from '../../../store/mapStateToProps';
import GlobalFunctions from '../../../utils/globalFunctions';

class Illustration extends React.Component {
  render() {
    const { ideas } = this.props.ideas;
    const { debateData } = this.props.debate;
    const { rootPath } = this.props.context;
    const index = this.props.index;
    return (
      <div className="illustration illustration-box">
        <div className="image-box" style={{ backgroundImage: `url(${ideas.latestIdeas[index].imgUrl})` }}>&nbsp;</div>
        <Link className="content-box" to={`${rootPath}${debateData.slug}/debate`}>
          <h3 className="light-title-3 center">{ideas.latestIdeas[index].title}</h3>
          <div className="stats">
            <div className="inline">{ideas.latestIdeas[index].nbPosts}</div>
            <Glyphicon glyph="message" color="white" size={20} desc="Number of contributions" />
          </div>
          <div className="text-box">{GlobalFunctions.parseHtml(ideas.latestIdeas[index].definition)}</div>
        </Link>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default connect(MapStateToProps)(Illustration);