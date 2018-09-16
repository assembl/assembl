// @flow
import React, { Fragment } from 'react';

import CircleAvatar from './circleAvatar';
import type { CircleAvatarProps } from './circleAvatar';

export type FictionHeaderProps = {
  authorFullname: string,
  publishedDate: string,
  displayedPublishedDate: string,
  circleAvatar: CircleAvatarProps
};

const noAuthorMessage: string = 'no author specified';

const FictionHeader = ({ authorFullname, publishedDate, displayedPublishedDate, circleAvatar }: FictionHeaderProps) => (
  <Fragment>
    <header className="header">
      <CircleAvatar {...circleAvatar} />
      <div className="meta">
        <p className="author">{authorFullname || noAuthorMessage}</p>
        <p className="date-time">
          <time dateTime={publishedDate} pubdate="true">
            {displayedPublishedDate}
          </time>
        </p>
      </div>
    </header>
    <hr />
  </Fragment>
);

export default FictionHeader;