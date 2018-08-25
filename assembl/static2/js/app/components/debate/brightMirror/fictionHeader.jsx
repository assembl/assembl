// @flow
import React, { Fragment } from 'react';

import CircleAvatar from './circleAvatar';
import type { CircleAvatarType } from './circleAvatar';

type FictionHeader = {
  /** Optional author fullname */
  authorFullname?: string,
  /** Optional article published date */
  publishedDate?: string,
  /** Optional circle avatar props */
  circleAvatar?: CircleAvatarType
};

const fictionHeader = ({ authorFullname, publishedDate, circleAvatar }: FictionHeader) => {
  // $FlowFixMe Cannot call `publishedDate.split` because property `split` is missing in undefined
  const formattedPublishedDate = publishedDate
    .split('-')
    .reverse()
    .join('/');

  return (
    <Fragment>
      <header className="header">
        <CircleAvatar {...circleAvatar} />
        <div className="meta">
          <p className="author">{authorFullname}</p>
          <p className="date-time">
            Le{' '}
            <time dateTime={publishedDate} pubdate>
              {formattedPublishedDate}
            </time>
          </p>
        </div>
      </header>
      <hr />
    </Fragment>
  );
};

fictionHeader.defaultProps = {
  authorFullname: 'no author specified',
  publishedDate: 'no published date specified',
  circleAvatar: {}
};

export default fictionHeader;