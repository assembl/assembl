// @flow
import React, { Fragment } from 'react';
// Components imports
import CircleAvatar from './circleAvatar';
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
  <Fragment>
    <ul>
      <li>
        <CircleAvatar {...circleAvatar} />
      </li>
      <li>{authorFullname || NO_AUTHOR_SPECIFIED}</li>
      <li>
        <time dateTime={publishedDate} pubdate="true">
          {displayedPublishedDate}
        </time>
      </li>
      <li>{commentContent}</li>
      <li>{numberOfChildComments}</li>
      <li>
        <ReplyToCommentButton />
      </li>
    </ul>
  </Fragment>
);

export default FictionComment;