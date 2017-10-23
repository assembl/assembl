import React from 'react';

class ResourceBlock extends React.Component {
  render() {
    const { index, resource } = this.props;
    const isImgRight = index % 2 === 0;
    const float = isImgRight ? 'right margin-case-left' : 'left margin-case-right';

    return (
      <div className="resource-block">
        <div className="title-section">
          <div className="title-hyphen" />
          <h1 className="dark-title-1">
            {resource.title}
          </h1>
        </div>
        <div className="resource-body">
          {resource.media.type === 'image' && <img src={resource.media.url} alt="resource" className={float} />}
          {resource.media.type === 'embed' &&
            <div className={float}>
              <iframe title="resource-video" src={resource.media.url} height={350} width={500} />
            </div>}
          <div className="resource-text">
            {resource.description}
            {resource.document &&
              <div className="resource-download-link">
                <a href={resource.document} target="_blank" rel="noopener noreferrer">
                  Download the report
                </a>
              </div>}
          </div>
          <div className="clear" />
        </div>
      </div>
    );
  }
}

export default ResourceBlock;