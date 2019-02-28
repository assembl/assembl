// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs, text, number, object, boolean } from '@storybook/addon-knobs';
/* eslint-enable */

// import components
import { FictionComment } from '../../../../components/debate/brightMirror/fictionComment';
import type {
  FictionCommentExtraProps,
  FictionCommentBaseProps,
  FictionCommentGraphQLProps
} from '../../../../components/debate/brightMirror/fictionComment';

// import existing storybook data
import { defaultCircleAvatar } from './circleAvatar.stories';

const defaultFictionCommentCallbacks: FictionCommentExtraProps = {
  submitCommentCallback: action('submitCommentCallback'),
  expandedFromTree: true,
  expandCollapseCallbackFromTree: action('expandCollapseCallbackFromTree')
};

export const defaultFictionComment: FictionCommentBaseProps = {
  measureTreeHeight: action('measureTreeHeight'),
  numChildren: 999,
  fictionCommentExtraProps: defaultFictionCommentCallbacks
};

export const defaultFictionCommentGraphQL: FictionCommentGraphQLProps = {
  authorUserId: 1234567890,
  authorFullname: 'Luke Skywalker',
  circleAvatar: { ...defaultCircleAvatar },
  commentId: 'dummyId',
  commentContent:
    'Est et rerum. Ut sed voluptatem possimus. Ut cumque magni sapiente voluptatem ut rerum aut harum quo. Non delectus quo.',
  contentLocale: 'fr',
  displayedPublishedDate: 'August 8th, 2018',
  modified: false,
  parentPostAuthorFullname: 'Dark Vador',
  publicationState: 'PUBLISHED',
  publishedDate: '2018-07-09',
  updateComment: action('updateComment')
};

const playground = {
  ...defaultFictionComment,
  ...defaultFictionCommentGraphQL
};

storiesOf('FictionComment', module)
  .addDecorator(withKnobs)
  .add('default', () => <FictionComment {...defaultFictionComment} {...defaultFictionCommentGraphQL} />)
  .add('playground', () => (
    <FictionComment
      authorUserId={playground.authorUserId}
      authorFullname={text('Author fullname', playground.authorFullname)}
      circleAvatar={object('circleAvatar', playground.circleAvatar)}
      commentContent={text('Comment content', playground.commentContent)}
      commentId={text('Comment id', playground.commentId)}
      contentLocale={playground.contentLocale}
      displayedPublishedDate={text('Displayed published date', playground.displayedPublishedDate)}
      measureTreeHeight={playground.measureTreeHeight}
      numChildren={number('Number of comments', playground.numChildren)}
      modified={boolean('Is modified', playground.modified)}
      parentPostAuthorFullname={text('Parent comment author fullname', playground.parentPostAuthorFullname)}
      publicationState={playground.publicationState}
      publishedDate={text('Published date', playground.publishedDate)}
      updateComment={playground.updateComment}
      fictionCommentExtraProps={playground.fictionCommentExtraProps}
    />
  ));