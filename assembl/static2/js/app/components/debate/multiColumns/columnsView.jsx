// @noflow
import * as React from 'react';
import get from 'lodash/get';
import { I18n } from 'react-redux-i18n';

import PostColumn from './postColumn';
import { orderPostsByMessageClassifier } from './utils';
import { getIfPhaseCompletedByIdentifier } from '../../../utils/timeline';
import TabbedColumns from './tabbedColumns';
import MultiColumns from './multiColumns';
import hashLinkScroll from '../../../utils/hashLinkScroll';
import { MIN_WIDTH_COLUMN, APP_CONTAINER_MAX_WIDTH } from '../../../constants';
import { withScreenWidth } from '../../common/screenDimensions';

class ColumnsView extends React.Component<$FlowFixMeProps> {
  componentDidMount() {
    hashLinkScroll();
  }

  shouldShowTabs = columnsCount => columnsCount * MIN_WIDTH_COLUMN > Math.min(this.props.screenWidth, APP_CONTAINER_MAX_WIDTH);

  render = () => {
    const {
      messageColumns,
      posts,
      ideaId,
      lang,
      contentLocaleMapping,
      initialRowIndex,
      noRowsRenderer,
      refetchIdea,
      routerParams,
      identifier,
      debateData,
      timeline
    } = this.props;
    if (!Array.isArray(messageColumns)) return null;
    const showSynthesis = messageColumns.some(column => !!get(column, 'columnSynthesis.body'));
    const columnsArray = orderPostsByMessageClassifier(messageColumns, posts);
    const isPhaseCompleted = getIfPhaseCompletedByIdentifier(timeline, identifier);
    let ColumnsComponent;
    if (this.shouldShowTabs(messageColumns.length)) {
      ColumnsComponent = TabbedColumns;
    } else {
      ColumnsComponent = MultiColumns;
    }
    return (
      <div className="max-container">
        <ColumnsComponent messageColumns={messageColumns}>
          {Object.keys(columnsArray).map((classifier, index) => {
            const col = messageColumns[index];
            const synthesisProps = showSynthesis && {
              classifier: classifier,
              debateData: debateData,
              identifier: identifier,
              mySentiment: get(col, 'columnSynthesis.mySentiment', null),
              routerParams: routerParams,
              sentimentCounts: get(col, 'columnSynthesis.sentimentCounts', 0),
              synthesisId: get(col, 'columnSynthesis.id'),
              synthesisTitle: get(col, 'columnSynthesis.subject', I18n.t('multiColumns.synthesis.title', { colName: col.name })),
              synthesisBody: get(col, 'columnSynthesis.body') || I18n.t('multiColumns.synthesis.noSynthesisYet'),
              // keep the || here, if body is empty string, we want noSynthesisYet message
              hyphenStyle: { borderTopColor: col.color }
            };
            return (
              <PostColumn
                key={classifier}
                synthesisProps={synthesisProps}
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
                withColumnHeader={!isPhaseCompleted}
              />
            );
          })}
        </ColumnsComponent>
      </div>
    );
  };
}

export default withScreenWidth(ColumnsView);