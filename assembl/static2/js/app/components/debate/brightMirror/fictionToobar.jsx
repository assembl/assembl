// @flow
import React from 'react';

import DeletePostButton from '../common/deletePostButton';

export type FictionToolbarProps = {
  fictionId: string,
  onDeleteCallback: Function
};

const fictionToolbar = ({ fictionId, onDeleteCallback }: FictionToolbarProps) => (
  <div className="action-buttons">
    <DeletePostButton postId={fictionId} onDeleteCallback={onDeleteCallback} />
  </div>
);

export default fictionToolbar;