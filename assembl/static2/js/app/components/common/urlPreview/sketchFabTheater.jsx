// @flow
import React from 'react';

import { fetchURLMetadata } from '../../../utils/urlPreview';
import { type Props as URLPreviewProps } from './urlPreview';

export type Props = {
  url: string
};

export type State = {
  open: boolean,
  loading: boolean,
  error: boolean,
  metadata: URLPreviewProps | null
};

export default class SketchFabTheater extends React.Component<Props, State> {
  state = {
    open: false,
    loading: true,
    error: false,
    metadata: null
  };

  componentDidMount() {
    // fetch the URL metadata from our web service
    fetchURLMetadata(
      this.props.url,
      (metadata) => {
        this.setState({ loading: false, metadata: metadata });
      },
      () => {
        this.setState({ loading: false, error: true });
      }
    );
  }

  closeTheater = () => this.setState({ open: false });

  openTheater = () => this.setState({ open: true });

  render = () => {
    const { open, loading, error, metadata } = this.state;
    if (loading || error) return null;
    const url = metadata && metadata.url;
    return (
      <div className={`embed-theater ${open ? 'open' : ''}`}>
        {url && open ? (
          <div className="theater-content">
            <div className="embed-video">
              <iframe
                title="Sketchfab"
                id="SketchfabPlayer"
                type="text/html"
                width="640"
                height="360"
                src={`${url}/embed?autostart=1&autospin=0.5`}
                frameBorder="0"
              />
              <button onClick={this.closeTheater} className="close-theater-button assembl-icon-cancel" />
            </div>
          </div>
        ) : (
          <div className="embed-thumbnail-container" onClick={this.openTheater}>
            <img src={metadata && metadata.thumbnailUrl} className="embed-thumbnail" alt="Sketchfab video" />
            <span className="play-button" />
          </div>
        )}
      </div>
    );
  };
}