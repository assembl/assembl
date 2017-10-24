import React from 'react';
import { I18n } from 'react-redux-i18n';

import { multiColumnMapping } from '../../../utils/mapping';
import PostColumn from './postColumn';
import { hexColorToRgba } from '../../../utils/color';
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
      idea,
      refetchIdea
    } = this.props;
    const activeKey = this.state && 'activeKey' in this.state ? this.state.activeKey : messageColumns[0].messageClassifier;
    const columnsArray = orderPostsByMessageClassifier(messageColumns, posts);
    const index = messageColumns.indexOf(
      messageColumns.find((messageColumn) => {
        return messageColumn.messageClassifier === activeKey;
      })
    );
    const synthesis = {
      classifier: activeKey,
      synthesisTitle: getSynthesisTitle(activeKey, messageColumns[index].name, idea.title),
      synthesisBody: messageColumns[index].header || I18n.t('multiColumns.synthesis.noSynthesisYet'),
      hyphenStyle: { borderTopColor: messageColumns[index].color }
    };
    const style = { width: `${100 / messageColumns.length}%` };
    const inactiveTabColor = 'lightgrey';
    const buttons = messageColumns.map((messageColumn) => {
      const classifier = messageColumn.messageClassifier;
      const isActive = classifier === activeKey;
      return (
        <div key={classifier} className={`${isActive ? 'active ' : ''}button-container`} style={style}>
          <button
            style={{ backgroundColor: isActive ? hexColorToRgba(messageColumn.color, COLUMN_OPACITY_GAIN) : inactiveTabColor }}
            onClick={(event) => {
              event.preventDefault();
              return this.setState({ activeKey: classifier });
            }}
            disabled={isActive}
          >
            {getTabTitle(classifier, messageColumn.name, idea.title)}
          </button>
        </div>
      );
    });
    const view = (
      <PostColumn
        synthesis={synthesis}
        width={width}
        contentLocaleMapping={contentLocaleMapping}
        lang={lang}
        data={columnsArray[activeKey]}
        initialRowIndex={initialRowIndex}
        noRowsRenderer={noRowsRenderer}
        ideaId={idea.id}
        refetchIdea={refetchIdea}
        ideaTitle={idea.title}
      />
    );
    return (
      <div className="tab-selector">
        <div className="tab-selector-buttons">
          {buttons}
        </div>
        <div className="tab-content">
          {view}
        </div>
      </div>
    );
  }
}