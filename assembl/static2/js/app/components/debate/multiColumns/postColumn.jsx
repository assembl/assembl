// @flow
import React from 'react';

import Tree from '../../common/tree';
import ColumnHeader from './columnHeader';
import FoldedPost from '../common/post/foldedPost';
import ColumnsPost from '../../../components/debate/multiColumns/columnsPost';
import ColumnSynthesis, { type Props as ColumnSynthesisProps } from './columnSynthesis';

const Separator = () => <div style={{ height: '25px' }} />;

const PostColumn = ({
  canEditPosts,
  color,
  classifier,
  title,
  synthesisProps,
  width,
  data,
  contentLocaleMapping,
  lang,
  initialRowIndex,
  noRowsRenderer,
  ideaId,
  refetchIdea,
  identifier
}: {
  canEditPosts: boolean,
  color: string,
  classifier: string,
  title: string,
  synthesisProps: ColumnSynthesisProps,
  width: number,
  data: Array<Post>,
  contentLocaleMapping: Object,
  lang: string,
  initialRowIndex: number,
  noRowsRenderer: Function,
  ideaId: string,
  refetchIdea: Function,
  identifier: string
}) => (
  <div className="column-view" style={{ width: width }}>
    {canEditPosts && (
      <ColumnHeader color={color} classifier={classifier} title={title} ideaId={ideaId} refetchIdea={refetchIdea} />
    )}
    {synthesisProps && <ColumnSynthesis {...synthesisProps} />}
    <div className="column-tree">
      {data.length > 0 ? (
        <Tree
          contentLocaleMapping={contentLocaleMapping}
          lang={lang}
          data={data}
          initialRowIndex={initialRowIndex}
          noRowsRenderer={noRowsRenderer}
          InnerComponent={ColumnsPost}
          InnerComponentFolded={FoldedPost}
          SeparatorComponent={Separator}
          identifier={identifier}
          innerComponentProps={{ editable: canEditPosts }}
        />
      ) : (
        noRowsRenderer()
      )}
    </div>
  </div>
);

export default PostColumn;