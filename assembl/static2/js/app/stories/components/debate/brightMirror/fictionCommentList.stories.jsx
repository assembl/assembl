// @flow
// There is no story for fictionCommentList. The file was created to export dummy data for testing purpose and to
// keep a consistent coding pattern. Story can be added once Tree.jsx becomes flow and storybook compliant.
import { action } from '@storybook/addon-actions';
import { Map } from 'immutable';
import { MESSAGE_VIEW } from '../../../../constants';

// import components
// import FictionCommentList from '../../../../components/debate/brightMirror/fictionCommentList';
import type { FictionCommentListProps } from '../../../../components/debate/brightMirror/fictionCommentList';

export const defaultFictionCommentList: FictionCommentListProps = {
  comments: [{ id: 'aaa', contentLocale: 'fr' }, { id: 'bbb', contentLocale: 'fr' }, { id: 'ccc', contentLocale: 'fr' }],
  contentLocale: 'fr',
  contentLocaleMapping: Map({ a: 1, b: 2, c: 3 }),
  messageViewOverride: MESSAGE_VIEW.brightMirror,
  identifier: 'brightMirror',
  onSubmitHandler: action('submitCommentCallback')
};