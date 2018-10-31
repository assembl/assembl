// @flow
import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';

export type ReplyToCommentButtonProps = {
  /** On click callback function */
  onClickCallback: Function,
  disabled?: boolean
};

const ReplyToCommentButton = ({ onClickCallback, disabled }: ReplyToCommentButtonProps) => (
  <Link className={classNames('action-reply', { disabled: disabled })} onClick={!disabled ? onClickCallback : null}>
    <span className="assembl-icon-back-arrow" />
  </Link>
);

ReplyToCommentButton.defaultProps = {
  disabled: false
};

export default ReplyToCommentButton;