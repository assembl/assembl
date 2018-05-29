// @flow
import * as React from 'react';

type Props = {
  id: string
};

type State = {
  open: boolean
};

export default class YoutubeTheater extends React.Component<Props, State> {
  state = {
    open: false
  };

  closeTheater = () => this.setState({ open: false });

  openTheater = () => this.setState({ open: true });

  render = () => {
    const { id } = this.props;
    const { open } = this.state;
    return (
      <div className={`embed-theater ${open ? 'open' : ''}`}>
        {open ? (
          <div className="theater-content">
            <div className="embed-video">
              <iframe
                title="YouTube video"
                id="ytplayer"
                type="text/html"
                width="640"
                height="360"
                src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                frameBorder="0"
              />
              <button onClick={this.closeTheater} className="close-theater-button assembl-icon-cancel" />
            </div>
          </div>
        ) : (
          <div className="embed-thumbnail-container" onClick={this.openTheater}>
            <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} className="embed-thumbnail" alt="youtube video" />
            <span className="play-button" />
          </div>
        )}
      </div>
    );
  };
}