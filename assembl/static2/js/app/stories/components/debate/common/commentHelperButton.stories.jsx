// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
/* eslint-enable */

import CommentHelperButton from '../../../../components/debate/common/commentHelperButton';
import type { Props as CommentHelperButtonProps } from '../../../../components/debate/common/commentHelperButton';

export const defaultCommentHelperButtonProps: CommentHelperButtonProps = {
  onClickCallback: action('onClickCallback'),
  linkClassName: 'some-class'
};

storiesOf('CommentHelperButton', module).add(
  'default',
  withInfo()(() => <CommentHelperButton {...defaultCommentHelperButtonProps} />)
);