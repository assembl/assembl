// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { EditorState, ContentState } from 'draft-js';
import { action } from '@storybook/addon-actions';
/* eslint-enable */

import InnerBoxSubmit, { type Props } from '../../../../../components/debate/brightMirror/sideComment/innerBoxSubmit';

export const defaultInnerBoxSubmitProps: Props = {
  userId: '1',
  userName: 'Odile Deray',
  body: EditorState.createWithContent(ContentState.createFromText('Hello')),
  updateBody: () => {},
  submit: action('submit'),
  cancelSubmit: action('cancelSubmit')
};

storiesOf('InnerBoxSubmit', module)
  .addDecorator(withKnobs)
  .add(
    'default',
    withInfo()(() => (
      <div className="harvesting-box">
        <InnerBoxSubmit {...defaultInnerBoxSubmitProps} />
      </div>
    ))
  );