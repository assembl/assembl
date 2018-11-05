// @flow
import React, { Fragment } from 'react';
import { Translate } from 'react-redux-i18n';
// Components imports
import CircleAvatar from './circleAvatar';
// import ToggleCommentButton from '../common/toggleCommentButton';
// Constant imports
// import { EMPTY_STRING, USER_ID_NOT_FOUND, DeletedPublicationStates, PublicationStates } from '../../../constants';
// Types imports
// import type { CircleAvatarProps } from './circleAvatar';

export type DeletedFictionCommentProps = {
  // Flag that checks if the message was deleted by either the Author or the Admin
  isDeletedByAuthor: boolean
};

const DeletedFictionComment = ({ isDeletedByAuthor }: DeletedFictionCommentProps) => {
  // Define deleted message to display
  const deletedByAuthorMessageKey = 'debate.thread.postDeletedByUser';
  const deletedByAdminMessageKey = 'debate.thread.postDeletedByAdmin';
  const deletedMessageKey = isDeletedByAuthor ? deletedByAuthorMessageKey : deletedByAdminMessageKey;

  return (
    <Fragment>
      <article className="comment-container">
        <CircleAvatar />
        <div className="content">
          <p className="comment">
            <Translate value={deletedMessageKey} />
          </p>
        </div>
      </article>
    </Fragment>
  );
};

export default DeletedFictionComment;