import React from 'react';
import { I18n } from 'react-redux-i18n';
import get from 'lodash/get';

import PostColumn from './postColumn';
import { orderPostsByMessageClassifier } from './utils';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';

const MultiColumns = ({
  messageColumns,
  posts,
  ideaId,
  width,
  lang,
  contentLocaleMapping,
  initialRowIndex,
  noRowsRenderer,
  refetchIdea,
  showSynthesis,
  identifier,
  debateData
}) => {
  const columnsArray = orderPostsByMessageClassifier(messageColumns, posts);
  return (
    <div className="multi-column-container">
      {Object.keys(columnsArray).map((classifier, index) => {
        const col = messageColumns[index];
        const synthesisProps = showSynthesis && {
          classifier: classifier,
          debateData: debateData,
          identifier: identifier,
          mySentiment: col.columnSynthesis.mySentiment,
          sentimentCounts: col.columnSynthesis.sentimentCounts,
          synthesisId: col.columnSynthesis.id,
          synthesisTitle: get(col, 'columnSynthesis.subject', I18n.t('multiColumns.synthesis.title', { colName: col.name })),
          synthesisBody: get(col, 'columnSynthesis.body', I18n.t('multiColumns.synthesis.noSynthesisYet')),
          hyphenStyle: { borderTopColor: col.color }
        };
        const isPhaseCompleted = getIfPhaseCompletedByIdentifier(debateData.timeline, identifier);
        const canEditPosts = !isPhaseCompleted && !get(col, 'columnSynthesis.body');
        return (
          <PostColumn
            key={classifier}
            canEditPosts={canEditPosts}
            synthesisProps={synthesisProps}
            width={width}
            contentLocaleMapping={contentLocaleMapping}
            lang={lang}
            color={col.color}
            classifier={classifier}
            title={col.title}
            data={columnsArray[classifier]}
            initialRowIndex={initialRowIndex}
            noRowsRenderer={noRowsRenderer}
            ideaId={ideaId}
            refetchIdea={refetchIdea}
            identifier={identifier}
            debateData={debateData}
          />
        );
      })}
    </div>
  );
};

export default MultiColumns;