// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
/* eslint-enable */

import ReplyToCommentButton from '../../../../components/debate/common/replyToCommentButton';
import type { ReplyToCommentButtonProps } from '../../../../components/debate/common/replyToCommentButton';

export const defaultReplyToCommentButton: ReplyToCommentButtonProps = {
  onClickCallback: action('onClickCallback')
};

export const disabledReplyToCommentButton: ReplyToCommentButtonProps = {
  onClickCallback: action('onClickCallback'),
  disabled: true
};

storiesOf('ReplyToCommentButton', module)
  .add('default', () => <ReplyToCommentButton {...defaultReplyToCommentButton} />)
  .add('disabled', () => <ReplyToCommentButton {...disabledReplyToCommentButton} />);