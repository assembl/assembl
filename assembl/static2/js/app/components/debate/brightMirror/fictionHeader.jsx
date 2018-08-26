// @flow
import React, { Fragment } from 'react';

import CircleAvatar from './circleAvatar';
import type { CircleAvatarType } from './circleAvatar';

export type FictionHeaderType = {
  /** Author fullname */
  authorFullname: string,
  /** Article published date, format is yyyy-mm-dd */
  publishedDate: Date,
  /** Circle avatar props */
  circleAvatar: CircleAvatarType
};

const noAuthorMessage: string = 'no author specified';

const fictionHeader = ({ authorFullname, publishedDate, circleAvatar }: FictionHeaderType) => {
  const formattedPublishedDate = publishedDate.toISOString().slice(0, 10);

  return (
    <Fragment>
      <header className="header">
        <CircleAvatar {...circleAvatar} />
        <div className="meta">
          <p className="author">{authorFullname || noAuthorMessage}</p>
          <p className="date-time">
            Le{' '}
            <time dateTime={formattedPublishedDate} pubdate>
              {formattedPublishedDate
                .split('-')
                .reverse()
                .join('/')}
            </time>
          </p>
        </div>
      </header>
      <hr />
    </Fragment>
  );
};

export default fictionHeader;