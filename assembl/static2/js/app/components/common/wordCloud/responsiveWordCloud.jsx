// @flow
import React, { Component } from 'react';

// Component imports
import ResizeAware from 'react-resize-aware';
import WordCloud, { defaultBaseProps as defaultWordCloudBaseProps } from './wordCloud';

// Type imports
import type { BaseProps as WordCloudBaseProps } from './wordCloud';

class ResponsiveWordCloud extends Component<WordCloudBaseProps> {
  static defaultProps = { ...defaultWordCloudBaseProps };

  shouldComponentUpdate(nextProps: WordCloudBaseProps) {
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

    const wordCloudProps: WordCloudBaseProps = {
      keywordsAngle: keywordsAngle,
      keywordsColor: keywordsColor,
      keywords: keywords,
      numberOfKeywordsToDisplay: numberOfKeywordsToDisplay,
      onMouseOutWord: onMouseOutWord,
      onMouseOverWord: onMouseOverWord,
      onWordClick: onWordClick
    };
    return (
      <ResizeAware>
        {(size) => {
          const width = size.width || 400; // default width
          const height = Math.min(width / 4 * 3, 500); // 4:3 ratio
          return <WordCloud {...wordCloudProps} height={height} width={width} />;
        }}
      </ResizeAware>
    );
  }
}

export default ResponsiveWordCloud;