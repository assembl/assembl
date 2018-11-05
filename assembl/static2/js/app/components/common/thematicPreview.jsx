// @flow
import React from 'react';
import { Link } from 'react-router';

import Statistic from './statistic';

type Props = {
  imgUrl: string,
  link: string,
  title: string,
  description: string,
  numPosts: number,
  numContributors: number
};

class ThematicPreview extends React.PureComponent<Props> {
  render() {
    const { imgUrl, link, title, description, numPosts, numContributors } = this.props;
    return (
      <div className="illustration-box idea-preview idea-preview-level-0">
        <div className="image-box" style={imgUrl ? { backgroundImage: `url(${imgUrl})` } : null} />
        <Link className="content-box" to={link}>
          <h3 className="light-title-3 center">{title}</h3>
          <Statistic numPosts={numPosts} numContributors={numContributors} />
          <div className="text-box">{description}</div>
        </Link>
        <div className="color-box">&nbsp;</div>
        <div className="box-hyphen">&nbsp;</div>
        <div className="box-hyphen rotate-hyphen">&nbsp;</div>
      </div>
    );
  }
}

export default ThematicPreview;