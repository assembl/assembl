import React from 'react';
import { I18n } from 'react-redux-i18n';

import { multiColumnMapping } from '../../../utils/mapping';
import PostColumn from './postColumn';
import { hexToRgb } from '../../../utils/globalFunctions';
import { COLUMN_OPACITY_GAIN } from '../../../constants';
import { orderPostsByMessageClassifier, getSynthesisTitle } from './utils';

const getTabTitle = (classifier, colName, ideaTitle) => {
  const mapping = multiColumnMapping(ideaTitle).tab;

  return mapping[classifier] || colName;
};

export default class TabbedColumns extends React.Component {
  render() {
    const {
      contentLocaleMapping,
      lang,
      width,
      posts,
      messageColumns,
      initialRowIndex,
      noRowsRenderer,
      ideaId,
      ideaTitle,
      refetchIdea,
      showSynthesis,
      identifier,
      debateData
    } = this.props;
    const activeKey = this.state && 'activeKey' in this.state ? this.state.activeKey : messageColumns[0].messageClassifier;
    const columnsArray = orderPostsByMessageClassifier(messageColumns, posts);
    const index = messageColumns.indexOf(
      messageColumns.find((messageColumn) => {
        return messageColumn.messageClassifier === activeKey;
      })
    );
    const synthesisProps = showSynthesis && {
      classifier: activeKey,
      synthesisTitle: getSynthesisTitle(activeKey, messageColumns[index].name, ideaTitle),
      synthesisBody: messageColumns[index].header || I18n.t('multiColumns.synthesis.noSynthesisYet'),
      hyphenStyle: { borderTopColor: messageColumns[index].color }
    };
    const style = { width: `${100 / messageColumns.length}%` };
    const inactiveTabColor = 'lightgrey';
    return (
      <div className="tab-selector">
        <div className="tab-selector-buttons">
          {messageColumns.map((messageColumn) => {
            const classifier = messageColumn.messageClassifier;
            const isActive = classifier === activeKey;
            return (
              <div key={classifier} className={`${isActive ? 'active ' : ''}button-container`} style={style}>
                <button
                  style={{
                    backgroundColor: isActive ? `rgba(${hexToRgb(messageColumn.color)},${COLUMN_OPACITY_GAIN})` : inactiveTabColor
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    return this.setState({ activeKey: classifier });
                  }}
                  disabled={isActive}
                >
                  {getTabTitle(classifier, messageColumn.name, ideaTitle)}
                </button>
              </div>
            );
          })}
        </div>
        <div className="tab-content">
          <PostColumn
            synthesisProps={synthesisProps}
            width={width}
            color={messageColumns[index].color}
            classifier={activeKey}
            contentLocaleMapping={contentLocaleMapping}
            lang={lang}
            data={columnsArray[activeKey]}
            initialRowIndex={initialRowIndex}
            noRowsRenderer={noRowsRenderer}
            ideaId={ideaId}
            refetchIdea={refetchIdea}
            ideaTitle={ideaTitle}
            identifier={identifier}
            debateData={debateData}
          />
        </div>
      </div>
    );
  }
}