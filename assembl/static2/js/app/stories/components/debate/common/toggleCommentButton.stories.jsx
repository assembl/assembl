// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, boolean } from '@storybook/addon-knobs';
/* eslint-enable */

import ToggleCommentButton from '../../../../components/debate/common/toggleCommentButton';
import type { ToggleCommentButtonProps } from '../../../../components/debate/common/toggleCommentButton';

export const defaultToggleCommentButton: ToggleCommentButtonProps = {
  isExpanded: true,
  onClickCallback: action('onClickCallback')
};

const playground = {
  ...defaultToggleCommentButton
};

storiesOf('ToggleCommentButton', module)
  .addDecorator(withKnobs)
  .add('default', () => <ToggleCommentButton {...defaultToggleCommentButton} />)
  .add('playground', () => (
    <ToggleCommentButton
      isExpanded={boolean('Expanded flag', playground.isExpanded)}
      onClickCallback={playground.onClickCallback}
    />
  ));