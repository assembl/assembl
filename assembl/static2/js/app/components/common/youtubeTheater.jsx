// @flow
import React from 'react';

export default class YoutubeTheater extends React.Component {
  state: {
    theaterMode: boolean
  };

  timeout: number;

  state = {
    theaterMode: false
  };

  closeTheater = () => this.setState({ theaterMode: false });

  openTheater = () => this.setState({ theaterMode: true });

  render = () => {
    const { videoId } = this.props;
    const { theaterMode } = this.state;
    const video = (
      <iframe
        title="YouTube video"
        id="ytplayer"
        type="text/html"
        width="640"
        height="360"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        frameBorder="0"
      />
    );
    return (
      <div className={`youtube-theater ${theaterMode ? 'open' : ''}`}>
        {theaterMode ? (
          <div className="theater-content">
            <div className="youtube-video">
              {video}
              <button onClick={this.closeTheater} className="close-theater-button assembl-icon-cancel" />
            </div>
          </div>
        ) : (
          <div
            className="youtube-thumbnail-container"
            onClick={this.openTheater}
            style={{ backgroundImage: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` }}
          >
            <img className="youtube-thumbnail" alt="youtube video" src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} />
            <span className="play-button" />
          </div>
        )}
      </div>
    );
  };
}