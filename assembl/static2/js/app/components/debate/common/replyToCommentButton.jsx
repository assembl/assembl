// @flow
import React from 'react';
import { Link } from 'react-router';
import classNames from 'classnames';
// Components imports
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { answerTooltip } from '../../common/tooltips';

export type ReplyToCommentButtonProps = {
  /** On click callback function */
  onClickCallback: Function,
  disabled?: boolean,
  tooltipPlacement?: 'top' | 'right' | 'bottom' | 'left'
};

const ReplyToCommentButton = ({ onClickCallback, disabled, tooltipPlacement }: ReplyToCommentButtonProps) => (
  <Link className={classNames('action-reply', { disabled: disabled })} onClick={onClickCallback}>
    <ResponsiveOverlayTrigger placement={tooltipPlacement || 'top'} tooltip={answerTooltip}>
      <span className="assembl-icon-back-arrow" />
    </ResponsiveOverlayTrigger>
  </Link>
);

ReplyToCommentButton.defaultProps = {
  disabled: false,
  tooltipPlacement: 'left'
};

export default ReplyToCommentButton;