// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
/* eslint-enable */

import ReplyToCommentButton from '../../../../components/debate/common/replyToCommentButton';
import type { ReplyToCommentButtonProps } from '../../../../components/debate/common/replyToCommentButton';

export const defaultReplyToCommentButton: ReplyToCommentButtonProps = {
  onClickCallback: action('onClickCallback')
};

storiesOf('ReplyToCommentButton', module).add(
  'default',
  withInfo()(() => <ReplyToCommentButton {...defaultReplyToCommentButton} />)
);