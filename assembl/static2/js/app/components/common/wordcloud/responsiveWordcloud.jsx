// @flow
import * as React from 'react';

import ResizeAware from 'react-resize-aware';

import type { Keywords, Keyword } from '../../../integration/semanticAnalysis/typeData';
import Wordcloud from './wordcloud';

export type Props = {
  keywordsAngle: number,
  keywordsColor: string,
  numberOfKeywordsToDisplay: number,
  onWordClick: (word: Keyword) => void,
  onMouseOverWord: (word: Keyword) => void,
  onMouseOutWord: (word: Keyword) => void,
  keywords: Keywords
};

class ResponsiveWordcloud extends React.Component<Props> {
  static defaultProps = {
    keywordsAngle: 0,
    keywordsColor: '#000',
    numberOfKeywordsToDisplay: 30,
    onWordClick: () => {},
    onMouseOverWord: () => {},
    onMouseOutWord: () => {}
  };

  shouldComponentUpdate(nextProps: Props) {
    const {
      keywordsAngle,
      keywordsColor,
      numberOfKeywordsToDisplay,
      onWordClick,
      onMouseOverWord,
      onMouseOutWord,
      keywords
    } = this.props;
    if (
      nextProps.keywordsAngle !== keywordsAngle ||
      nextProps.keywordsColor !== keywordsColor ||
      nextProps.numberOfKeywordsToDisplay !== numberOfKeywordsToDisplay ||
      nextProps.onWordClick !== onWordClick ||
      nextProps.keywords !== keywords ||
      nextProps.onMouseOverWord !== onMouseOverWord ||
      nextProps.onMouseOutWord !== onMouseOutWord
    ) {
      return true;
    }
    return false;
  }

  render() {
    const {
      keywordsAngle,
      keywordsColor,
      numberOfKeywordsToDisplay,
      onWordClick,
      onMouseOverWord,
      onMouseOutWord,
      keywords
    } = this.props;

    return (
      <ResizeAware>
        {(size) => {
          const width = size.width || 400; // default width
          const height = Math.min(width / 4 * 3, 500); // 4:3 ratio
          return (
            <Wordcloud
              keywordsAngle={keywordsAngle}
              keywordsColor={keywordsColor}
              numberOfKeywordsToDisplay={numberOfKeywordsToDisplay}
              onWordClick={onWordClick}
              onMouseOverWord={onMouseOverWord}
              onMouseOutWord={onMouseOutWord}
              keywords={keywords}
              width={width}
              height={height}
            />
          );
        }}
      </ResizeAware>
    );
  }
}

export default ResponsiveWordcloud;