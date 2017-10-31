import React from 'react';

import Tree from '../../common/tree';
import ColumnHeader from './columnHeader';
import ColumnsPost from '../../../components/debate/multiColumns/columnsPost';
import { PostFolded } from '../../../components/debate/thread/post';
import BoxWithHyphen from '../../common/boxWithHyphen';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';

const Separator = () => {
  return <div style={{ height: '25px' }} />;
};

const Synthesis = ({ classifier, synthesisTitle, synthesisBody, hyphenStyle }) => {
  return (
    <div id={`synthesis-${classifier}`} className="box synthesis background-grey">
      <BoxWithHyphen
        additionalContainerClassNames="column-synthesis"
        subject={synthesisTitle}
        body={synthesisBody}
        hyphenStyle={hyphenStyle}
      />
    </div>
  );
};

export default ({
  color,
  classifier,
  synthesisProps,
  width,
  data,
  contentLocaleMapping,
  lang,
  initialRowIndex,
  noRowsRenderer,
  ideaId,
  refetchIdea,
  ideaTitle,
  identifier,
  debateData
}) => {
  const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, identifier);
  return (
    <div className="column-view" style={{ width: width }}>
      {!isPhaseCompleted
        ? <ColumnHeader color={color} classifier={classifier} ideaId={ideaId} refetchIdea={refetchIdea} ideaTitle={ideaTitle} />
        : null}
      {synthesisProps && <Synthesis {...synthesisProps} />}
      <div className="column-tree">
        {data.length > 0
          ? <Tree
            contentLocaleMapping={contentLocaleMapping}
            lang={lang}
            data={data || []}
            initialRowIndex={initialRowIndex}
            noRowsRenderer={noRowsRenderer}
            InnerComponent={ColumnsPost}
            InnerComponentFolded={PostFolded}
            SeparatorComponent={Separator}
            identifier={identifier}
          />
          : noRowsRenderer()}
      </div>
    </div>
  );
};