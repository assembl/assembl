// @flow
import React, { Component } from 'react';

// Component imports
import ResizeAware from 'react-resize-aware';
import WordCloud, { defaultBaseProps as defaultWordCloudBaseProps } from './wordCloud';

// Type imports
import type { BaseProps as WordCloudBaseProps } from './wordCloud';

type Size = {
  width: number,
  height: number
};

class ResponsiveWordCloud extends Component<WordCloudBaseProps> {
  static defaultProps = { ...defaultWordCloudBaseProps };

  shouldComponentUpdate(nextProps: WordCloudBaseProps) {
    const {
      keywordsAngle,
      keywordsColor,
      keywordsColorActive,
      numberOfKeywordsToDisplay,
      onMouseOutWord,
      onMouseOverWord,
      onWordClick
    } = this.props;
    return (
      nextProps.keywordsAngle !== keywordsAngle ||
      nextProps.keywordsColor !== keywordsColor ||
      nextProps.keywordsColorActive !== keywordsColorActive ||
      nextProps.numberOfKeywordsToDisplay !== numberOfKeywordsToDisplay ||
      nextProps.onMouseOutWord !== onMouseOutWord ||
      nextProps.onMouseOverWord !== onMouseOverWord ||
      nextProps.onWordClick !== onWordClick
    );
  }

  render() {
    const {
      keywordsAngle,
      keywordsColor,
      keywordsColorActive,
      keywords,
      numberOfKeywordsToDisplay,
      onMouseOutWord,
      onMouseOverWord,
      onWordClick
    } = this.props;

    const wordCloudProps: WordCloudBaseProps = {
      keywordsAngle: keywordsAngle,
      keywordsColor: keywordsColor,
      keywordsColorActive: keywordsColorActive,
      keywords: keywords,
      numberOfKeywordsToDisplay: numberOfKeywordsToDisplay,
      onMouseOutWord: onMouseOutWord,
      onMouseOverWord: onMouseOverWord,
      onWordClick: onWordClick
    };

    return (
      <ResizeAware>
        {(size: Size) => {
          const width: number = size.width || 400; // default width
          const height: number = Math.min(width / 4 * 3, 500); // 4:3 ratio
          return <WordCloud {...wordCloudProps} height={height} width={width} />;
        }}
      </ResizeAware>
    );
  }
}

export default ResponsiveWordCloud;