// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, number, object } from '@storybook/addon-knobs';
/* eslint-enable */

// import components
import { FictionComment } from '../../../../components/debate/brightMirror/fictionComment';
import type { FictionCommentProps, FictionCommentGraphQLProps } from '../../../../components/debate/brightMirror/fictionComment';

// import existing storybook data
import { defaultCircleAvatar } from './circleAvatar.stories';

export const defaultFictionComment: FictionCommentProps = {
  submitCommentCallback: action('submitCommentCallback')
};

export const defaultFictionCommentGraphQL: FictionCommentGraphQLProps = {
  authorFullname: 'Helen Aguilar',
  publishedDate: '2018-07-09',
  displayedPublishedDate: 'August 8th, 2018',
  commentParentId: 'dummyId',
  commentContent:
    'Est et rerum. Ut sed voluptatem possimus. Ut cumque magni sapiente voluptatem ut rerum aut harum quo. Non delectus quo.',
  numberOfChildComments: 999,
  circleAvatar: { ...defaultCircleAvatar }
};

const playground = {
  ...defaultFictionComment,
  ...defaultFictionCommentGraphQL
};

storiesOf('FictionComment', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionComment {...defaultFictionComment} {...defaultFictionCommentGraphQL} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionComment
        authorFullname={text('Author fullname', playground.authorFullname)}
        publishedDate={text('Published date', playground.publishedDate)}
        displayedPublishedDate={text('Displayed published date', playground.displayedPublishedDate)}
        commentParentId={text('Comment parent id', playground.commentParentId)}
        commentContent={text('Comment content', playground.commentContent)}
        numberOfChildComments={number('Number of comments', playground.numberOfChildComments)}
        circleAvatar={object('circleAvatar', playground.circleAvatar)}
        submitCommentCallback={playground.submitCommentCallback}
      />
    ))
  );