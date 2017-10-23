// @flow
import React from 'react';

export type Media = {
  type: string,
  url: string
};

export type ResourceBlockProps = {
  title: string,
  description: string,
  media: Media,
  doc: string,
  index: number
};

const ResourceBlock = (props: ResourceBlockProps) => {
  const { index, title, description, media, doc } = props;
  const { type, url } = media;
  const isImgRight = index % 2 === 0;
  const float = isImgRight ? 'right margin-case-left' : 'left margin-case-right';

  return (
    <div className="resource-block">
      <div className="title-section">
        <div className="title-hyphen" />
        <h1 className="dark-title-1">
          {title}
        </h1>
      </div>
      <div className="resource-body">
        {type === 'image' && <img src={url} alt="resource" className={float} />}
        {type === 'embed' &&
          <div className={float}>
            <iframe title="resource-video" src={url} height={350} width={500} />
          </div>}
        <div className="resource-text">
          {description}
          {doc &&
            <div className="resource-download-link">
              <a href={doc} target="_blank" rel="noopener noreferrer">
                Download the report
              </a>
            </div>}
        </div>
        <div className="clear" />
      </div>
    </div>
  );
};

export default ResourceBlock;