// @flow
import React from 'react';
import { Link } from 'react-router';

export type ReplyToCommentButtonProps = {
  /** On click callback function */
  onClickCallback: Function
};

const ReplyToCommentButton = ({ onClickCallback }: ReplyToCommentButtonProps) => (
  <Link onClick={onClickCallback}>
    <span className="assembl-icon-back-arrow" />
  </Link>
);

export default ReplyToCommentButton;