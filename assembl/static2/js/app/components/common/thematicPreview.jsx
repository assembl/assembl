import React from 'react';
import { Link } from 'react-router';
import Statistic from './statistic';

class ThematicPreview extends React.Component {
  render() {
    const { imgUrl, link, title, description, numPosts, numContributors } = this.props;
    const imageBoxStyle = {};
    if (imgUrl) {
      imageBoxStyle.backgroundImage = `url(${imgUrl})`;
    }
    return (
      <div className="illustration illustration-box">
        <div className="image-box" style={imageBoxStyle}>
          &nbsp;
        </div>
        <Link className="content-box" to={link}>
          <h3 className="light-title-3 center">
            {title}
          </h3>
          <Statistic numPosts={numPosts} numContributors={numContributors} />
          <div className="text-box">
            {description}
          </div>
        </Link>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default ThematicPreview;