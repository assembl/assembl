// @flow
import * as React from 'react';

export type displayResponseAuthorProps = {
  authorFullname: string,
  /** Circle avatar props */
  parentPostAuthorFullname: ?string,
  /** Comment displayed published date */
  displayedPublishedDate: string,
  /** Comment published date */
  publishedDate: string,
  displayIsEdited: React.Node
};

const displayResponseAuthor = ({
  authorFullname,
  parentPostAuthorFullname,
  publishedDate,
  displayedPublishedDate,
  displayIsEdited
}: displayResponseAuthorProps) => (
  <header className="meta">
    <p className="author">
      <strong>{authorFullname}</strong>
      <span className="parent-info">
        {parentPostAuthorFullname ? <span className="assembl-icon-back-arrow" /> : null}
        {parentPostAuthorFullname}
      </span>
    </p>
    <p className="published-date">
      <time dateTime={publishedDate} pubdate="true">
        {displayedPublishedDate}
      </time>
      {displayIsEdited}
    </p>
  </header>
);

export default displayResponseAuthor;