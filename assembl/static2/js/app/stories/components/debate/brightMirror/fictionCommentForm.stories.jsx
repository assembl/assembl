// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
/* eslint-enable */

import FictionCommentForm from '../../../../components/debate/brightMirror/fictionCommentForm';
import type { FictionCommentFormProps } from '../../../../components/debate/brightMirror/fictionCommentForm';

const actions: { [name: string]: Function } = {
  onCancelCommentCallback: action('onCancelCommentCallback'),
  onSubmitCommentCallback: action('onSubmitCommentCallback')
};

export const defaultFictionCommentProps: FictionCommentFormProps = {
  onCancelCommentCallback: actions.onCancelCommentCallback,
  onSubmitCommentCallback: actions.onSubmitCommentCallback
};

storiesOf('FictionCommentForm', module).add('default', withInfo()(() => <FictionCommentForm {...defaultFictionCommentProps} />));