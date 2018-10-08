// @flow
import React from 'react';
import { Map } from 'immutable';
import { Translate } from 'react-redux-i18n';
// Components imports
import { Tree } from '../../../components/common/tree';
import FictionComment from './fictionComment';
// import FoldedPost from '../common/post/foldedPost';
import InfiniteSeparator from '../../../components/common/infiniteSeparator';
// Type imports

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
  const NoRowsRenderer = () => (
    <div className="center">
      <Translate value="debate.thread.noPostsInThread" />
    </div>
  );

  const FoldedComments = () => (
    <div className="center">
      <Translate value="debate.thread.foldedPostLink" count={9999999999} />
    </div>
  );

  return (
    <Tree
      contentLocaleMapping={contentLocaleMapping}
      lang={contentLocale}
      data={comments}
      initialRowIndex={FIRST_ROW_INDEX}
      InnerComponent={FictionComment}
      InnerComponentFolded={FoldedComments}
      noRowsRenderer={NoRowsRenderer}
      SeparatorComponent={InfiniteSeparator}
      identifier={identifier}
      submitCommentCallback={onSubmitHandler}
    />
  );
};

export default FictionCommentList;