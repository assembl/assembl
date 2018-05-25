// @flow
import React from 'react';

import Embed from './embed';
// import Frame from './frame';

export type URLPreviewProps = {
  id: string,
  url: string,
  html: string,
  title: string,
  description: string,
  thumbnailUrl: string,
  providerName: string,
  faviconUrl: string,
  authorName: string,
  authorAvatar: string,
  afterLoad: ?Function
};

class URLPreview extends React.Component<*, URLPreviewProps, void> {
  componentDidMount() {
    const { html, afterLoad } = this.props;
    if (!html && afterLoad) afterLoad();
  }

  render() {
    const { id } = this.props;
    // If we have an integration HTML code, we need to include it into an iframe
    // if (html) return <Frame id={id} html={html} afterLoad={afterLoad} />;
    const { authorName, authorAvatar, url, title, description, thumbnailUrl, providerName, faviconUrl } = this.props;
    // isContribution like a twitter post
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
            <div key={`${id}url-header`} className="url-header">
              <img alt="favicon" className="url-header-avatar" src={faviconUrl} />
              <span className="url-header-title">{providerName}</span>
            </div>,
            <a key={`${id}url-link`} target="_blank" href={url} className="url-link">
              {title}
            </a>
          ]
        )}
        <div className="url-content-container">
          <div className="url-description">{description}</div>
          <div className="url-media-container">
            <Embed
              url={url}
              defaultEmbed={
                thumbnailUrl && <div style={{ backgroundImage: `url("${thumbnailUrl}")` }} className="url-img-preview" />
              }
            />
          </div>
        </div>
        {isContribution && (
          <div className="url-footer">
            <img alt="favicon" className="url-footer-avatar" src={faviconUrl} />
            <span className="url-footer-title">{providerName}</span>
          </div>
        )}
      </div>
    );
  }
}

export default URLPreview;