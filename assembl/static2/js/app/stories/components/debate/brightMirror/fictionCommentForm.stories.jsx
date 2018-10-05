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

export const defaultFictionCommentForm: FictionCommentFormProps = {
  onCancelCommentCallback: actions.onCancelCommentCallback,
  onSubmitCommentCallback: actions.onSubmitCommentCallback,
  rowsForTextarea: 2
};

storiesOf('FictionCommentForm', module).add('default', withInfo()(() => <FictionCommentForm {...defaultFictionCommentForm} />));