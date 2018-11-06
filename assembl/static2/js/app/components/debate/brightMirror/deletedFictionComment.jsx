// @flow
import React, { Fragment } from 'react';
import { Translate } from 'react-redux-i18n';
// Components imports
import CircleAvatar from './circleAvatar';
import ToggleCommentButton from '../common/toggleCommentButton';
// Types imports
import type { ToggleCommentButtonProps } from '../common/toggleCommentButton';

export type DeletedFictionCommentProps = {
  /** Expand collapse callback function set from FictionComment > Tree.jsx  */
  expandCollapseCallbackFromTree?: ?Function,
  /** Expand flag set from FictionComment > Tree.jsx */
  expandedFromTree?: ?boolean,
  // Flag that checks if the message was deleted by either the Author or the Admin
  isDeletedByAuthor: boolean,
  /** Number of child comments */
  numChildren: number
};

const DeletedFictionComment = ({
  expandCollapseCallbackFromTree,
  expandedFromTree,
  isDeletedByAuthor,
  numChildren
}: DeletedFictionCommentProps) => {
  // Translation key
  const deletedByAuthorMsgKey = 'debate.thread.postDeletedByUser';
  const deletedByAdminMsgKey = 'debate.thread.postDeletedByAdmin';
  const numberOfResponsesMsgKey = 'debate.brightMirror.numberOfResponses';

  // Define deleted message to display
  const deletedMessageKey = isDeletedByAuthor ? deletedByAuthorMsgKey : deletedByAdminMsgKey;

  const toggleCommentButtonProps: ToggleCommentButtonProps = {
    isExpanded: expandedFromTree || false,
    onClickCallback: expandCollapseCallbackFromTree != null ? expandCollapseCallbackFromTree : () => null
  };

  // Display ToggleCommentButton only when there are answers to a comment
  const displayToggleCommentButton = numChildren > 0 ? <ToggleCommentButton {...toggleCommentButtonProps} /> : null;

  const displayCommentContent = (
    <p className="comment">
      <Translate value={deletedMessageKey} />
    </p>
  );

  const displayFooter = (
    <footer className="toolbar">
      <div className="left-content">
        <p>
          <Translate value={numberOfResponsesMsgKey} count={numChildren} />
        </p>
        {displayToggleCommentButton}
      </div>
    </footer>
  );

  return (
    <Fragment>
      <article className="comment-container">
        {/** CircleAvatar is used here with its defaults props values */}
        <CircleAvatar />
        <div className="content">
          {displayCommentContent}
          {displayFooter}
        </div>
      </article>
    </Fragment>
  );
};

DeletedFictionComment.defaultProps = {
  expandCollapseCallbackFromTree: null,
  expandedFromTree: null
};

export default DeletedFictionComment;