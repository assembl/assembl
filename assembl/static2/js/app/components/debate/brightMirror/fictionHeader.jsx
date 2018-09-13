// @flow
import React, { Fragment } from 'react';
// Components imports
import CircleAvatar from './circleAvatar';
// Constant imports
import { NO_AUTHOR_SPECIFIED } from '../../../constants';
// Types imports
import type { CircleAvatarProps } from './circleAvatar';

export type FictionHeaderProps = {
  authorFullname: string,
  publishedDate: string,
  displayedPublishedDate: string,
  circleAvatar: CircleAvatarProps
};

const FictionHeader = ({ authorFullname, publishedDate, displayedPublishedDate, circleAvatar }: FictionHeaderProps) => (
  <Fragment>
    <header className="header">
      <CircleAvatar {...circleAvatar} />
      <div className="meta">
        <p className="author">{authorFullname || NO_AUTHOR_SPECIFIED}</p>
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