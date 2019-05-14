// @flow
import * as React from 'react';

type Props = {
  id: string
};

const YoutubeVideo = ({ id }: Props) => (
  <div className="embed-responsive embed-responsive-16by9">
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
);

export default YoutubeVideo;