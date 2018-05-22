import React from 'react';
import ReactFrame from 'react-frame-component';
import { resizeIframe, getScripts } from '../../utils/urlPreview';

const styles = {
  border: 'none',
  position: 'relative',
  visibility: 'visible',
  display: 'block',
  margin: 0,
  padding: 0
};

class Frame extends React.Component {
  constructor(props) {
    super(props);
    const { id } = props;
    this.id = `iframe-${id}`;
  }

  id = 'iframe';

  frameContentDidMount = () => {
    // when the iframe content is loaded, we need to resize the iframe container
    resizeIframe(this.id);
  };

  getDocument = () => {
    const { html } = this.props;
    // getDocument: get the iframe document with the scripts specified in the html
    // to execute the scripts we must add them to the header
    // getScripts: extract the scripts from th html
    const scripts = getScripts(html).map(script => `<script src='${script}' async='' charset='utf-8'></script>`);
    // add the scripts to the header
    return `<!DOCTYPE html><html><head>${scripts.join(
      ''
    )} <style type='text/css'>iframe { width: 100% !important} </style></head><body><div id='htmlmount'></div></body></html>`;
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