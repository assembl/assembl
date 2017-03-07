import React from 'react';
import { connect } from 'react-redux';
import Statistic from './statistic';
import MapStateToProps from '../../../store/mapStateToProps';

class Theme extends React.Component {
  render() {
    const { ideas } = this.props.ideas;
    const { debateData } = this.props.debate;
    const { rootPath, connectedUserId } = this.props.context;
    const index = this.props.index;
    return (
      <div className="illustration illustration-box">
        <div className="image-box" style={{ backgroundImage: `url(${ideas.latestIdeas[index].imgUrl})` }}>&nbsp;</div>
        <a className="content-box" href={connectedUserId ? `/${debateData.slug}/idea/local:Idea/${ideas.latestIdeas[index].id}` : `${rootPath}${debateData.slug}/login`}>
          <h3 className="light-title-3 center">{ideas.latestIdeas[index].title}</h3>
          <Statistic index={index} />
          <div className="text-box">{<p dangerouslySetInnerHTML={{ __html: ideas.latestIdeas[index].definition }} />}</div>
        </a>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default connect(MapStateToProps)(Theme);