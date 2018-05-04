// @flow
import React from 'react';

import { EMBED_REGEXP } from '../../utils/globalFunctions';
import YoutubeEmbed from './youtubeTheater';
// import SketchfabEmbed from './sketchfabEmbed';

type EmbedProps = {
  url: string,
  defaultEmbed: *
};

const Embed = ({ url, defaultEmbed }: EmbedProps) => {
  const isYoutubeVideo = url.match(EMBED_REGEXP.youtube);
  if (isYoutubeVideo) return <YoutubeEmbed videoId={isYoutubeVideo[1]} />;
  // const isSketchfab = url.match(EMBED_REGEXP.sketchfab);
  // if (isSketchfab) return <SketchfabEmbed id={isSketchfab[2]} />;
  return defaultEmbed;
};

export default Embed;