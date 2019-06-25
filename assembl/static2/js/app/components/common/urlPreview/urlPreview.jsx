// @flow
import React from 'react';

import Embed from './embed';
// For a future development (integration of graphs ...)
// import Frame from './frame';

export type Props = {
  id: string,
  url: string,
  html: string, // eslint-disable-line react/no-unused-prop-types
  title: string,
  description: string,
  thumbnailUrl: string,
  providerName: string,
  faviconUrl: string,
  authorName: string,
  authorAvatar: string,
  afterLoad: ?Function
};

class URLPreview extends React.Component<Props> {
  componentDidMount() {
    // const { html, afterLoad } = this.props;
    // if (!html && afterLoad) afterLoad();
    const { afterLoad } = this.props;
    if (afterLoad) afterLoad();
  }

  render() {
    const { id } = this.props;
    // For a future development (integration of graphs ...)
    // If we have an integration HTML code, we need to include it into an iframe (the Frame component)
    // if (html) return <Frame id={id} html={html} afterLoad={afterLoad} />;
    const { authorName, authorAvatar, url, title, description, thumbnailUrl, providerName, faviconUrl } = this.props;
    console.log('authorName', authorName);
    console.log('authorAvatar', authorAvatar);
    console.log('url', url);
    console.log('title', title);
    console.log('description', description);
    console.log('thumbnailUrl', thumbnailUrl);
    console.log('providerName', providerName);
    console.log('faviconUrl', faviconUrl);
    // isContribution like a twitter post
    const isContribution = authorName || authorAvatar;
    return (
      <div className="url-container">
        {isContribution ? (
          <div className="url-header">
            {authorAvatar && <img src={authorAvatar} className="url-contribution-avatar" alt={authorName} />}
            <a target="_blank" href={url} className="url-contribution-title">
              {title}
            </a>
            <span className="url-author-name">{authorName}</span>
          </div>
        ) : (
          [
            <div key={`${id}url-header`} className="url-header">
              {faviconUrl && <img alt="favicon" className="url-header-avatar" src={faviconUrl} />}
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
                thumbnailUrl ? <div style={{ backgroundImage: `url("${thumbnailUrl}")` }} className="url-img-preview" /> : null
              }
            />
          </div>
        </div>
        {isContribution && (
          <div className="url-footer">
            {faviconUrl && <img alt="favicon" className="url-footer-avatar" src={faviconUrl} />}
            <span className="url-footer-title">{providerName}</span>
          </div>
        )}
      </div>
    );
  }
}

export default URLPreview;