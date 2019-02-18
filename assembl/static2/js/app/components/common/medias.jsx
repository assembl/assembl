// @flow
import React, { Fragment } from 'react';

import { videoUtilities } from '../../utils/videoUtilities';

export type Props = {
  path: string
};

export const Medias = ({ path }: Props) => (
  <Fragment>
    {videoUtilities.pathIsVideoFile(path) ? (
      <video src={path} controls preload="none" width="100%" height="100%" /> // eslint-disable-line
    ) : (
      <iframe title="resource-iframe" src={path} className="resource-iframe" frameBorder="0" allowFullScreen />
    )}
  </Fragment>
);

export default Medias;