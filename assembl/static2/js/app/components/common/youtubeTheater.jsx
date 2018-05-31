// @flow
import * as React from 'react';

type Props = {
  videoId: string
};

type State = {
  open: boolean
};

export default class YoutubeTheater extends React.Component<Props, State> {
  timeout: number;

  state = {
    open: false
  };

  closeTheater = () => this.setState({ open: false });

  openTheater = () => this.setState({ open: true });

  render = () => {
    const { videoId } = this.props;
    const { open } = this.state;
    return (
      <div className={`youtube-theater ${open ? 'open' : ''}`}>
        {open ? (
          <div className="theater-content">
            <div className="youtube-video">
              <iframe
                title="YouTube video"
                id="ytplayer"
                type="text/html"
                width="640"
                height="360"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                frameBorder="0"
              />
              <button onClick={this.closeTheater} className="close-theater-button assembl-icon-cancel" />
            </div>
          </div>
        ) : (
          <div className="youtube-thumbnail-container" onClick={this.openTheater}>
            <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} className="youtube-thumbnail" alt="youtube video" />
            <span className="play-button" />
          </div>
        )}
      </div>
    );
  };
}