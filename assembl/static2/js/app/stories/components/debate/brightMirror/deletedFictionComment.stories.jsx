// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, boolean, number } from '@storybook/addon-knobs';
/* eslint-enable */

// import components
import DeletedFictionComment from '../../../../components/debate/brightMirror/deletedFictionComment';
import type { DeletedFictionCommentProps } from '../../../../components/debate/brightMirror/deletedFictionComment';

export const defaultDeletedFictionComment: DeletedFictionCommentProps = {
  expandCollapseCallbackFromTree: action('expandCollapseCallbackFromTree'),
  expandedFromTree: true,
  isDeletedByAuthor: true,
  numChildren: 999
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
      <DeletedFictionComment
        expandCollapseCallbackFromTree={playground.expandCollapseCallbackFromTree}
        expandedFromTree={playground.expandedFromTree}
        isDeletedByAuthor={boolean('Is comment deleted by author', playground.isDeletedByAuthor)}
        numChildren={number('Number of comments', playground.numChildren)}
      />
    ))
  );