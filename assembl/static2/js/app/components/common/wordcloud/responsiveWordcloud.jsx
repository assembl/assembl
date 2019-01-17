// @flow
import * as React from 'react';

import ResizeAware from 'react-resize-aware';

import type { Keyword, Keywords } from '../../../integration/semanticAnalysis/typeData';
import Wordcloud from './wordcloud';

export type Props = {
  /** Optional angle value in degrees */
  keywordsAngle: number,
  /** optional color */
  keywordsColor: string,
  /** Array of keywords */
  keywords: Keywords,
  /** Optional maximum number of keywords to show */
  numberOfKeywordsToDisplay: number,
  /** Optional callback function called when a word is hovered in */
  onMouseOutWord: (word: Keyword) => void,
  /** Optional callback function called when a word is hovered out */
  onMouseOverWord: (word: Keyword) => void,
  /** Optional callback function called when a word is clicked */
  onWordClick: (word: Keyword) => void
};

class ResponsiveWordcloud extends React.Component<Props> {
  static defaultProps = {
    keywordsAngle: 0,
    keywordsColor: '100, 0, 200',
    numberOfKeywordsToDisplay: 30,
    onMouseOutWord: () => {},
    onMouseOverWord: () => {},
    onWordClick: () => {}
  };

  shouldComponentUpdate(nextProps: Props) {
    const {
      keywordsAngle,
      keywordsColor,
      keywords,
      numberOfKeywordsToDisplay,
      onMouseOutWord,
      onMouseOverWord,
      onWordClick
    } = this.props;
    if (
      nextProps.keywordsAngle !== keywordsAngle ||
      nextProps.keywordsColor !== keywordsColor ||
      nextProps.keywords !== keywords ||
      nextProps.numberOfKeywordsToDisplay !== numberOfKeywordsToDisplay ||
      nextProps.onMouseOutWord !== onMouseOutWord ||
      nextProps.onMouseOverWord !== onMouseOverWord ||
      nextProps.onWordClick !== onWordClick
    ) {
      return true;
    }
    return false;
  }

  render() {
    const {
      keywordsAngle,
      keywordsColor,
      keywords,
      numberOfKeywordsToDisplay,
      onMouseOutWord,
      onMouseOverWord,
      onWordClick
    } = this.props;

    return (
      <ResizeAware>
        {(size) => {
          const width = size.width || 400; // default width
          const height = Math.min(width / 4 * 3, 500); // 4:3 ratio
          return (
            <Wordcloud
              height={height}
              keywordsAngle={keywordsAngle}
              keywordsColor={keywordsColor}
              keywords={keywords}
              numberOfKeywordsToDisplay={numberOfKeywordsToDisplay}
              onMouseOutWord={onMouseOutWord}
              onMouseOverWord={onMouseOverWord}
              onWordClick={onWordClick}
              width={width}
            />
          );
        }}
      </ResizeAware>
    );
  }
}

export default ResponsiveWordcloud;