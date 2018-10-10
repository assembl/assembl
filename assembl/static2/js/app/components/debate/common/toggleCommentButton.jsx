// @flow
import React from 'react';
import { Link } from 'react-router';

export type ToggleCommentButtonProps = {
  /** Expand flag that changes the icon style */
  isExpanded: boolean,
  /** On click callback function */
  onClickCallback: Function
};

const ToggleCommentButton = ({ isExpanded, onClickCallback }: ToggleCommentButtonProps) => {
  const iconStyle = isExpanded ? 'down' : 'up';

  return (
    <Link className="action-toggle" onClick={onClickCallback}>
      <span className={`assembl-icon-${iconStyle}-open`} />
    </Link>
  );
};

export default ToggleCommentButton;