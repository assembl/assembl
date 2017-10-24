import React from 'react';
import { I18n } from 'react-redux-i18n';

import PostColumn from './postColumn';
import { orderPostsByMessageClassifier, getSynthesisTitle } from './utils';

export default ({
  messageColumns,
  posts,
  idea,
  width,
  lang,
  contentLocaleMapping,
  initialRowIndex,
  noRowsRenderer,
  refetchIdea
}) => {
  const columnsArray = orderPostsByMessageClassifier(messageColumns, posts);
  return (
    <div className="multi-column-container">
      {Object.keys(columnsArray).map((classifier, index) => {
        const synthesis = {
          classifier: classifier,
          synthesisTitle: getSynthesisTitle(classifier, messageColumns[index].name, idea.title),
          synthesisBody: messageColumns[index].header || I18n.t('multiColumns.synthesis.noSynthesisYet'),
          hyphenStyle: { borderTopColor: messageColumns[index].color }
        };
        return (
          <PostColumn
            key={classifier}
            synthesis={synthesis}
            width={width}
            contentLocaleMapping={contentLocaleMapping}
            lang={lang}
            data={columnsArray[classifier]}
            initialRowIndex={initialRowIndex}
            noRowsRenderer={noRowsRenderer}
            ideaId={idea.id}
            refetchIdea={refetchIdea}
            ideaTitle={idea.title}
          />
        );
      })}
    </div>
  );
};