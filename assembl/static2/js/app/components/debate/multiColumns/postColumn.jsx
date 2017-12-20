// @flow
import React from 'react';

import Tree from '../../common/tree';
import ColumnHeader from './columnHeader';
import FoldedPost from '../common/post/foldedPost';
import ColumnsPost from '../../../components/debate/multiColumns/columnsPost';
import ColumnSynthesis, { type Props as ColumnSynthesisProps } from './columnSynthesis';

const Separator = () => <div style={{ height: '25px' }} />;

type Props = {
  canEditPosts: boolean,
  classifier: string,
  debateData: DebateData,
  color: string,
  contentLocaleMapping: Object,
  data: Array<Post>,
  ideaId: string,
  identifier: string,
  initialRowIndex: number,
  lang: string,
  noRowsRenderer: Function,
  refetchIdea: Function,
  synthesisProps: ColumnSynthesisProps,
  title: string,
  width: number,
  withColumnHeader: boolean
};

const PostColumn = ({
  classifier,
  color,
  contentLocaleMapping,
  data,
  ideaId,
  identifier,
  initialRowIndex,
  lang,
  noRowsRenderer,
  refetchIdea,
  synthesisProps,
  title,
  width,
  withColumnHeader
}: Props) => (
  <div className="column-view" style={{ width: width }}>
    {withColumnHeader && (
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
        />
      ) : (
        noRowsRenderer()
      )}
    </div>
  </div>
);

export default PostColumn;