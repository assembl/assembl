// @flow

// import components
// import FictionComment from '../../../../components/debate/brightMirror/fictionComment';
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