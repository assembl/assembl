// @flow
import React from 'react';
import { Map } from 'immutable';
// Components imports
import Tree from '../../../components/common/tree';
import FictionComment from './fictionComment';
// Type imports

export type FictionCommentListProps = {
  /** Array of fiction comments */
  comments: Array<TreeItem & { id: string, contentLocale: string }>,
  /** Content locale used by Tree */
  contentLocale: string,
  /** Content locale mapping used by Tree */
  contentLocaleMapping: Map<string, string>,
  /** Identifier of the idea - e.g 'brightMirror' */
  identifier: string
};

const FictionCommentList = ({ comments, contentLocale, contentLocaleMapping, identifier }: FictionCommentListProps) => {
  const FIRST_ROW_INDEX = 0;
  const NoComponent = () => null;

  return (
    <Tree
      contentLocaleMapping={contentLocaleMapping}
      lang={contentLocale}
      data={comments}
      initialRowIndex={FIRST_ROW_INDEX}
      InnerComponent={FictionComment}
      InnerComponentFolded={NoComponent}
      noRowsRenderer={NoComponent}
      SeparatorComponent={NoComponent}
      identifier={identifier}
      InnerComponentHeight={125}
    />
  );
};

export default FictionCommentList;