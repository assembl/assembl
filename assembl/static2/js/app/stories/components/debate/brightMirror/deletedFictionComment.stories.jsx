// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, boolean } from '@storybook/addon-knobs';
/* eslint-enable */

// import components
import DeletedFictionComment from '../../../../components/debate/brightMirror/deletedFictionComment';
import type { DeletedFictionCommentProps } from '../../../../components/debate/brightMirror/deletedFictionComment';

export const defaultDeletedFictionComment: DeletedFictionCommentProps = {
  isDeletedByAuthor: true
};

const playground = {
  ...defaultDeletedFictionComment
};

storiesOf('DeletedFictionComment', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <DeletedFictionComment {...defaultDeletedFictionComment} />))
  .add(
    'playground',
    withInfo()(() => (
      <DeletedFictionComment isDeletedByAuthor={boolean('Is comment deleted by author', playground.isDeletedByAuthor)} />
    ))
  );