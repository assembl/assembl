import React from 'react';

import Tree from '../../common/tree';
import ColumnHeader from './columnHeader';
import ColumnsPost from '../../../components/debate/multiColumns/columnsPost';
import { PostFolded } from '../../../components/debate/thread/post';

const Separator = () => {
  return <div style={{ height: '25px' }} />;
};

export default ({
  synthesis,
  width,
  data,
  contentLocaleMapping,
  lang,
  initialRowIndex,
  noRowsRenderer,
  ideaId,
  refetchIdea,
  ideaTitle
}) => {
  return (
    <div className="column-view" style={{ width: width }}>
      <ColumnHeader synthesis={synthesis} ideaId={ideaId} refetchIdea={refetchIdea} ideaTitle={ideaTitle} />
      <div className="column-tree">
        <Tree
          contentLocaleMapping={contentLocaleMapping}
          lang={lang}
          data={data || []}
          initialRowIndex={initialRowIndex}
          noRowsRenderer={noRowsRenderer}
          InnerComponent={ColumnsPost}
          InnerComponentFolded={PostFolded}
          SeparatorComponent={Separator}
        />
      </div>
    </div>
  );
};