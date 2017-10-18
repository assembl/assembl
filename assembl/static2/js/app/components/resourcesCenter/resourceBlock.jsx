import React from 'react';

class ResourceBlock extends React.Component {
  render() {
    const { title, bodyText, imgUrl, index } = this.props;
    const isImgRight = index % 2 === 0;
    const float = isImgRight ? 'right padding-left' : 'left padding-right';
    return (
      <div className="resource-block">
        <div className="title-section">
          <div className="title-hyphen" />
          <h1 className="dark-title-1">
            {title}
          </h1>
        </div>
        <div className="resource-body">
          <img src={imgUrl} alt="resource" className={float} />
          <div className="resource-text">
            {bodyText}
            {bodyText}
          </div>
          <div className="clear" />
        </div>
      </div>
    );
  }
}

export default ResourceBlock;