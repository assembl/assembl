// @flow
import React, { Fragment } from 'react';
import { I18n } from 'react-redux-i18n';
// Components imports
import CircleAvatar from './circleAvatar';
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
        <p className="author">{authorFullname || I18n.t('debate.brightMirror.noAuthorSpecified')}</p>
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