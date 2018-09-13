// @flow
import React from 'react';
// Components imports
import CircleAvatar from './circleAvatar';
import ToggleCommentButton from '../common/toggleCommentButton';
import ReplyToCommentButton from '../common/replyToCommentButton';
// Constant imports
import { NO_AUTHOR_SPECIFIED } from '../../../constants';
// Types imports
import type { CircleAvatarProps } from './circleAvatar';

export type FictionCommentProps = {
  /** Author fullname */
  authorFullname: string,
  /** Comment published date, TODO: change it into moment date */
  publishedDate: string,
  /** Comment displayed published date */
  displayedPublishedDate: string,
  /** Comment content */
  commentContent: string,
  /** Number of child comments */
  numberOfChildComments: number,
  /** Circle avatar props */
  circleAvatar: CircleAvatarProps
};

const FictionComment = ({
  authorFullname,
  publishedDate,
  displayedPublishedDate,
  commentContent,
  numberOfChildComments,
  circleAvatar
}: FictionCommentProps) => (
  <article className="comment-container">
    <CircleAvatar {...circleAvatar} />
    <div className="content">
      <header className="meta">
        <p>
          <strong>{authorFullname || NO_AUTHOR_SPECIFIED}</strong>
        </p>
        <p className="published-date">
          <time dateTime={publishedDate} pubdate="true">
            &nbsp;-&nbsp;{displayedPublishedDate}
          </time>
        </p>
      </header>
      <p className="comment">{commentContent}</p>
      <footer className="toolbar">
        <p>{numberOfChildComments} answers</p>
        <ToggleCommentButton />
        <ReplyToCommentButton />
      </footer>
    </div>
  </article>
);

export default FictionComment;