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

/* Safely decode a html text - interpret entities, remove tags, prevent xss */
function safeTextDecode(text: string): string {
  if (!text) {
    return '';
  }
  let doc;
  try {
    doc = new DOMParser().parseFromString(text, 'text/html');
  } catch (error) {
    return text;
  }
  if (doc.documentElement) {
    return doc.documentElement.textContent;
  }
  return '';
}

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
    const { authorName, authorAvatar, url, thumbnailUrl, providerName, faviconUrl } = this.props;
    // isContribution like a twitter post
    const isContribution = authorName || authorAvatar;
    const title = safeTextDecode(this.props.title);
    const description = safeTextDecode(this.props.description);
    return (
      <span className="url-container">
        {isContribution ? (
          <span className="url-header">
            {authorAvatar && <img src={authorAvatar} className="url-contribution-avatar" alt={authorName} />}
            <a target="_blank" href={url} className="url-contribution-title">
              {title}
            </a>
            <span className="url-author-name">{authorName}</span>
          </span>
        ) : (
          [
            <span key={`${id}url-header`} className="url-header">
              {faviconUrl && <img alt="favicon" className="url-header-avatar" src={faviconUrl} />}
              <span className="url-header-title">{providerName}</span>
            </span>,
            <a key={`${id}url-link`} target="_blank" href={url} className="url-link">
              {title}
            </a>
          ]
        )}
        <span className="url-content-container">
          <span className="url-description">{description}</span>
          <span className="url-media-container">
            <Embed
              url={url}
              defaultEmbed={
                thumbnailUrl ? <span style={{ backgroundImage: `url("${thumbnailUrl}")` }} className="url-img-preview" /> : null
              }
            />
          </span>
        </span>
        {isContribution && (
          <span className="url-footer">
            {faviconUrl && <img alt="favicon" className="url-footer-avatar" src={faviconUrl} />}
            <span className="url-footer-title">{providerName}</span>
          </span>
        )}
      </span>
    );
  }
}

export default URLPreview;