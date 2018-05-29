// @flow
// For a future development (integration of graphs ...)
import React from 'react';
import ReactFrame from 'react-frame-component';

import { resizeIframe, getScripts, getIframeDocument, type Script } from '../../../utils/urlPreview';

type FrameProps = {
  id: string,
  html: string,
  afterLoad: ?Function
};

const styles = {
  border: 'none',
  position: 'relative',
  visibility: 'visible',
  display: 'block',
  margin: 0,
  padding: 0
};

class Frame extends React.Component<FrameProps, void> {
  constructor(props: FrameProps) {
    super(props);
    this.id = `iframe-${props.id}`;
  }

  id = 'iframe';

  frameContentDidMount = () => {
    const { afterLoad } = this.props;
    // when the iframe content is loaded, we need to resize the iframe container
    resizeIframe(this.id, afterLoad);
  };

  getDocument = () => {
    const { html } = this.props;
    // getDocument: get the iframe document with the scripts specified in the html
    // to execute the scripts we must add them to the header
    // getScripts: extract the scripts from the html
    const scripts = getScripts(html).map((script: Script) => {
      if (script.type === 'url') return `<script src='${script.src}' async='' charset='utf-8'></script>`;
      return `<script>${script.src}</script>`;
    });
    // add the scripts to the header
    return getIframeDocument(scripts.join(''));
  };

  render() {
    const { html } = this.props;
    return (
      <ReactFrame
        className="url-iframe"
        id={this.id}
        contentDidMount={this.frameContentDidMount}
        style={styles}
        initialContent={this.getDocument()}
        mountTarget="#htmlmount"
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </ReactFrame>
    );
  }
}

export default Frame;