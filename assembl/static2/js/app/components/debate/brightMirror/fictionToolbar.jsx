// @flow
import React from 'react';

import DeletePostButton from '../common/deletePostButton';

export type FictionToolbarProps = {
  /** Fiction identifier */
  fictionId: string,
  /** Boolean to tell if user can delete */
  userCanDelete: boolean,
  /** Delete fiction callback, should only be set when current user is either the author of the fiction or an admin */
  onDeleteCallback?: () => void
};

const fictionToolbar = ({ fictionId, userCanDelete, onDeleteCallback }: FictionToolbarProps) => (
  <div className="action-buttons">
    {userCanDelete ? <DeletePostButton postId={fictionId} onDeleteCallback={onDeleteCallback} /> : null}
  </div>
);

fictionToolbar.defaultProps = {
  onDeleteCallback: null
};

export default fictionToolbar;