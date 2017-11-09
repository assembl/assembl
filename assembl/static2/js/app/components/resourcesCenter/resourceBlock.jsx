// @flow
import React from 'react';

export type Media = {
  type: string,
  url: string
};

export type ResourceBlockProps = {
  title: string,
  text: string,
  image: Object,
  doc: Object,
  embedCode: string,
  index: number
};

const ResourceBlock = (props: ResourceBlockProps) => {
  const { index, title, text, embedCode, image, doc } = props;
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
        {image && <img src={image.externalUrl} alt="resource" className={float} />}
        {embedCode &&
          <div className={float}>
            <iframe title="resource-video" src={embedCode} height={350} width={500} />
          </div>}
        <div className="resource-text">
          {text}
          {doc &&
            <div className="resource-download-link">
              <a href={doc.externalUrl} target="_blank" rel="noopener noreferrer">
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