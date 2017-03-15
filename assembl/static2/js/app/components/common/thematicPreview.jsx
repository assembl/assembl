import React from 'react';
import Statistic from './statistic';

class Thematic extends React.Component {
  render() {
    const bkgImgUrl = this.props.bkgImgUrl;
    const link = this.props.link;
    const title = this.props.title;
    const description = this.props.description;
    const nbPosts = this.props.nbPosts;
    const nbContributors = this.props.nbContributors;
    return (
      <div className="illustration illustration-box">
        <div className="image-box" style={{ backgroundImage: `url(${bkgImgUrl})` }}>&nbsp;</div>
        <a className="content-box" href={link}>
          <h3 className="light-title-3 center">{title}</h3>
          <Statistic nbPosts={nbPosts} nbContributors={nbContributors} />
          <div className="text-box">{description}</div>
        </a>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default Thematic;