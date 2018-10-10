// @flow
import React from 'react';
import { Map } from 'immutable';
import { Translate } from 'react-redux-i18n';
// Components imports
import { Tree } from '../../../components/common/tree';
import FictionComment from './fictionComment';
import FoldedPost from '../common/post/foldedPost';
import InfiniteSeparator from '../../../components/common/infiniteSeparator';
// Type imports
import type { FictionCommentExtraProps } from './fictionComment';

export type FictionCommentListProps = {
  /** Array of fiction comments */
  comments: Array<TreeItem & { id: string, contentLocale: string }>,
  /** Content locale used by Tree */
  contentLocale: string,
  /** Content locale mapping used by Tree */
  contentLocaleMapping: Map<string, string>,
  /** Identifier of the idea - e.g 'brightMirror' */
  identifier: string,
  /** Submit comment callback used in order to catch a submit event from tree.jsx */
  onSubmitHandler: Function
};

const FictionCommentList = ({
  comments,
  contentLocale,
  contentLocaleMapping,
  identifier,
  onSubmitHandler
}: FictionCommentListProps) => {
  const FIRST_ROW_INDEX = 0;

  // Component that will be rendered when no post if posted
  const NoRowsRenderer = () => (
    <div className="no-row center">
      <Translate value="debate.thread.noPostsInThread" />
    </div>
  );

  const fictionCommentExtraProps: FictionCommentExtraProps = {
    submitCommentCallback: onSubmitHandler
  };

  return (
    <Tree
      contentLocaleMapping={contentLocaleMapping}
      lang={contentLocale}
      data={comments}
      initialRowIndex={FIRST_ROW_INDEX}
      InnerComponent={FictionComment}
      InnerComponentFolded={FoldedPost}
      noRowsRenderer={NoRowsRenderer}
      SeparatorComponent={InfiniteSeparator}
      identifier={identifier}
      fictionCommentExtraProps={fictionCommentExtraProps}
    />
  );
};

export default FictionCommentList;