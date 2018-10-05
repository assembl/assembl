// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, number, object } from '@storybook/addon-knobs';
/* eslint-enable */

// import components
import { FictionComment } from '../../../../components/debate/brightMirror/fictionComment';
import type { FictionCommentGraphQLProps } from '../../../../components/debate/brightMirror/fictionComment';

// import existing storybook data
import { defaultCircleAvatar } from './circleAvatar.stories';

export const defaultFictionComment: FictionCommentGraphQLProps = {
  authorFullname: 'Helen Aguilar',
  publishedDate: '2018-07-09',
  displayedPublishedDate: 'August 8th, 2018',
  commentContent:
    'Est et rerum. Ut sed voluptatem possimus. Ut cumque magni sapiente voluptatem ut rerum aut harum quo. Non delectus quo.',
  numberOfChildComments: 999,
  circleAvatar: { ...defaultCircleAvatar }
};

const playground = {
  ...defaultFictionComment
};

storiesOf('FictionComment', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionComment {...defaultFictionComment} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionComment
        authorFullname={text('Author fullname', playground.authorFullname)}
        publishedDate={text('Published date', playground.publishedDate)}
        displayedPublishedDate={text('Displayed published date', playground.displayedPublishedDate)}
        commentContent={text('Comment content', playground.commentContent)}
        numberOfChildComments={number('Number of comments', playground.numberOfChildComments)}
        circleAvatar={object('circleAvatar', playground.circleAvatar)}
      />
    ))
  );