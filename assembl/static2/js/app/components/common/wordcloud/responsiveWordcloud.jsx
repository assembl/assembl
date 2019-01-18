// @flow
import React, { Component } from 'react';

// Component imports
import ResizeAware from 'react-resize-aware';
import WordCloud, { baseDefaultProps } from './wordCloud';

// Type imports
import type { BaseProps } from './wordCloud';

class ResponsiveWordCloud extends Component<BaseProps> {
  static defaultProps = baseDefaultProps;

  shouldComponentUpdate(nextProps: BaseProps) {
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

    let wordCloudProps = {
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
          wordCloudProps = { ...wordCloudProps, width: width, height: height };
          return <WordCloud {...wordCloudProps} />;
        }}
      </ResizeAware>
    );
  }
}

export default ResponsiveWordCloud;