// @flow
import * as React from 'react';
import classnames from 'classnames';
import { Grid } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';

import Medias from '../common/medias';

export type Media = {
  type: string,
  url: string
};

export type Props = {
  title: string,
  text: string,
  image: StrictFile | null,
  doc: StrictFile | null,
  embedCode: string,
  index: number
};

const ResourceBlock = (props: Props) => {
  const { index, title, text, embedCode, image, doc } = props;
  const isEven = index % 2 === 0;
  const float = isEven ? 'rsc-media-right margin-case-left' : 'rsc-media-left margin-case-right';
  const videoClassNames = classnames([float, 'resource-video']);
  const imgClassNames = classnames([float, 'resource-img']);
  const resourceBlockClassNames = isEven ? 'background-grey' : 'background-light';

  return (
    <Grid fluid className={resourceBlockClassNames}>
      <div className="max-container resource-block">
        <div className="title-section">
          <div className="title-hyphen" />
          <h1 className="dark-title-1">{title}</h1>
        </div>
        <div className="page-body">
          {image && (
            <div className="resource-img-container">
              <img src={image.externalUrl} alt="resource" className={imgClassNames} />
            </div>
          )}
          {embedCode &&
            !image && (
              <div className="resource-video-container">
                <div className={videoClassNames}>
                  <Medias path={embedCode} />
                </div>
              </div>
            )}
          <div className="resource-text">
            <p dangerouslySetInnerHTML={{ __html: text }} />
            {doc && (
              <div className="resource-download-link">
                <a href={doc.externalUrl}>
                  <Translate value="resourcesCenter.download" />
                </a>
              </div>
            )}
          </div>
          <div className="clear" />
        </div>
      </div>
    </Grid>
  );
};

export default ResourceBlock;