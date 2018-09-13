// @flow
import React from 'react';
/* eslint-disable import/no-extraneous-dependencies */
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs, text, number, object } from '@storybook/addon-knobs';
/* eslint-enable */

// import components
import FictionComment from '../../../../components/debate/brightMirror/fictionComment';
import type { FictionCommentProps } from '../../../../components/debate/brightMirror/fictionComment';

// import existing storybook data
import { defaultCircleAvatar } from './circleAvatar.stories';

export const defaultFictionComment: FictionCommentProps = {
  authorFullname: 'Helen Aguilar',
  publishedDate: '2018-07-09',
  displayedPublishedDate: 'August 8th, 2018',
  commentContent:
    'Est et rerum. Ut sed voluptatem possimus. Ut cumque magni sapiente voluptatem ut rerum aut harum quo. Non delectus quo.',
  numberOfChildComments: 999,
  circleAvatar: { ...defaultCircleAvatar }
};

const playgroundButton = {
  ...defaultFictionComment
};

storiesOf('FictionComment', module)
  .addDecorator(withKnobs)
  .add('default', withInfo()(() => <FictionComment {...defaultFictionComment} />))
  .add(
    'playground',
    withInfo()(() => (
      <FictionComment
        authorFullname={text('Author fullname', playgroundButton.authorFullname)}
        publishedDate={text('Published date', playgroundButton.publishedDate)}
        displayedPublishedDate={text('Displayed published date', playgroundButton.displayedPublishedDate)}
        commentContent={text('Comment content', playgroundButton.commentContent)}
        numberOfChildComments={number('Number of comments', playgroundButton.numberOfChildComments)}
        circleAvatar={object('circleAvatar', playgroundButton.circleAvatar)}
      />
    ))
  );