import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Statistic from './statistic';
import MapStateToProps from '../../../store/mapStateToProps';

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
          <Statistic index={index} />
          <div className="text-box">{<p dangerouslySetInnerHTML={{ __html: ideas.latestIdeas[index].definition }} />}</div>
        </Link>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default connect(MapStateToProps)(Illustration);