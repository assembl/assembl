// @flow
import React from 'react';

import Embed from './embed';
import Frame from './frame';

type URLContentProps = {
  url: string,
  description: string,
  thumbnailUrl: string
};

type URLPreviewProps = {
  title: string,
  providerName: string,
  faviconUrl: string,
  authorName: string,
  authorAvatar: string
};

type URLEmbedProps = {
  html: string,
  id: string
};

export const URLContent = ({ url, description, thumbnailUrl }: URLContentProps) => [
  <div className="url-content-container">
    <div className="url-description">{description}</div>
    <div className="url-media-container">
      <Embed
        url={url}
        defaultEmbed={thumbnailUrl && <div style={{ backgroundImage: `url("${thumbnailUrl}")` }} className="url-img-preview" />}
      />
    </div>
  </div>
];

export const URLEmbed = ({ html, id }: URLEmbedProps) => <Frame id={id} html={html} />;

const URLPreview = (props: URLPreviewProps & URLContentProps & URLEmbedProps) => {
  const { html, id } = props;
  if (html) return <URLEmbed html={html} id={id} />;
  const { authorName, authorAvatar, url, title, description, thumbnailUrl, providerName, faviconUrl } = props;
  const isContribution = authorName || authorAvatar;
  return (
    <div className="url-container">
      {isContribution ? (
        <div className="url-header">
          <img src={authorAvatar} className="url-contribution-avatar" alt={authorName} />
          <a target="_blank" href={url} className="url-contribution-title">
            {title}
          </a>
          <span className="url-author-name">{authorName}</span>
        </div>
      ) : (
        [
          <div className="url-header">
            <img alt="favicon" className="url-header-avatar" src={faviconUrl} />
            <span className="url-header-title">{providerName}</span>
          </div>,
          <a target="_blank" href={url} className="url-link">
            {title}
          </a>
        ]
      )}
      <URLContent url={url} description={description} thumbnailUrl={thumbnailUrl} />
      {isContribution && (
        <div className="url-footer">
          <img alt="favicon" className="url-footer-avatar" src={faviconUrl} />
          <span className="url-footer-title">{providerName}</span>
        </div>
      )}
    </div>
  );
};

export default URLPreview;