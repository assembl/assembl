import React, { Component } from 'react';

import { Col } from 'react-bootstrap';
import activeHtml from 'react-active-html';
import ARange from 'annotator_range'; // eslint-disable-line
import Embed from '../../common/urlPreview/embed';
import URLMetadataLoader from '../../common/urlPreview/urlMetadataLoader';
import { isSpecialURL } from '../../../utils/urlPreview';


const postBodyReplacementComponents = () => ({
  iframe: attributes => (
    // the src iframe url is different from the resource url
    <Embed url={attributes['data-source-url'] || attributes.src} defaultEmbed={<iframe title="post-embed" {...attributes} />} />
  ),
  a: (attributes) => {
    const embeddedUrl = isSpecialURL(attributes.href);
    const origin = (
      <a key={`url-link-${attributes.href}`} href={attributes.href} className="linkified" target="_blank">
        {attributes.href}
      </a>
    );
    if (embeddedUrl) return origin;
    return [origin, <URLMetadataLoader key={`url-preview-${attributes.href}`} url={attributes.href} />];
  },
});


class BrightMirrorInstructionView extends Component<> {
  render = () => {
    const { announcementContent } = this.props;
    return (
      <div className="announcement">
        <div className="announcement-title">
          <div className="title-hyphen">&nbsp;</div>
          <h3 className="announcement-title-text dark-title-1">
            { announcementContent.title }
          </h3>
        </div>
        <Col xs={12} md={8} className="announcement-media col-md-push-4">
          <div>{ activeHtml(announcementContent.body, postBodyReplacementComponents()) }</div>
        </Col>
      </div>
    );
  };
}

export default BrightMirrorInstructionView;