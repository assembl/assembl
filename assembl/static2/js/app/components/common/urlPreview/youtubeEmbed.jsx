// @flow
import * as React from 'react';

type Props = {
  id: string
};

const YoutubeVideo = ({ id }: Props) => (
  <div className="video-wrapper">
    <div className="video-container">
      <iframe
        title="YouTube video"
        id="ytplayer"
        type="text/html"
        width="640"
        height="360"
        src={`https://www.youtube.com/embed/${id}?autoplay=0`}
        frameBorder="0"
      />
    </div>
  </div>
);

export default YoutubeVideo;