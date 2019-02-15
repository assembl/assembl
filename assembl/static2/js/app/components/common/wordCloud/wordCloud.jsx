// @flow
import React, { Component } from 'react';

import ReactWordCloud from 'react-wordcloud';

import type { Keyword, Keywords } from '../../../pages/semanticAnalysis/dataType';

// Keys used to fetch keyword data
const WORD_COUNT_KEY = 'score';
const WORD_KEY = 'value';

export type BaseProps = {
  /** Optional angle value in degrees */
  keywordsAngle: number,
  /** Optional color Hex 3 or 6 only */
  keywordsColor: string,
  /** Optional color when a word is active Hex 3 or 6 only */
  keywordsColorActive: string,
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

export type Props = BaseProps & {
  /** Optional height */
  height: number,
  /** Optional width */
  width: number
};

export const defaultBaseProps = {
  keywordsAngle: 0,
  keywordsColor: '#000',
  keywordsColorActive: '#000',
  numberOfKeywordsToDisplay: 20,
  onMouseOutWord: () => {},
  onMouseOverWord: () => {},
  onWordClick: () => {}
};

class WordCloud extends Component<Props> {
  static defaultProps = {
    ...defaultBaseProps,
    height: 500,
    width: 400
  };

  componentDidUpdate(prevProps: Props) {
    if (
      this.props.keywordsColor !== prevProps.keywordsColor ||
      this.props.keywordsColorActive !== prevProps.keywordsColorActive
    ) {
      this.forceUpdate();
    }
  }

  render() {
    const {
      height,
      keywordsAngle,
      keywordsColor,
      keywordsColorActive,
      keywords,
      numberOfKeywordsToDisplay,
      onMouseOutWord,
      onMouseOverWord,
      onWordClick,
      width
    } = this.props;

    const maxAngle = keywordsAngle;
    const minAngle = maxAngle * -1;
    const noData = !keywords.length;

    const interval = {
      max: Math.max(...Array.from(keywords, x => x[WORD_COUNT_KEY])),
      min: Math.min(...Array.from(keywords, x => x[WORD_COUNT_KEY]))
    };
    if (interval.max === interval.min) {
      interval.min = 0;
    }

    /**
     * Function to be used with ReactWordCloud which maps each keyword with a color.
     *
     * Takes a color and returns a function depending on a keyword. The function returns
     * the color with an opacity depending on d data.
     *
     * @param {string} color String color in the format Hex 3 or 6.
     *
     * @return {function} Function takes a Keyword as parameter and returns a color with opacity
     * depending on the Keyword parameters.
     */
    const addOpacityToColorHEX = (color: string) => (d) => {
      const opacity = 0.5 + 0.5 * (d[WORD_COUNT_KEY] - interval.min) / (interval.max - interval.min);
      const stringOpacity = Math.round(15 * opacity).toString(16);
      return `${color}${stringOpacity}${color.length === 7 ? stringOpacity : ''}`;
    };

    const reactWordCloudProps = {
      colorScale: addOpacityToColorHEX(keywordsColor),
      colorScaleActive: addOpacityToColorHEX(keywordsColorActive),
      fontFamily: 'LatoMedium',
      height: height,
      maxAngle: maxAngle,
      maxWords: numberOfKeywordsToDisplay,
      minAngle: minAngle,
      onMouseOutWord: (word: Keyword) => onMouseOutWord(word),
      onMouseOverWord: (word: Keyword) => onMouseOverWord(word),
      onWordClick: (word: Keyword) => onWordClick(word),
      orientations: 20,
      scale: 'linear',
      tooltipEnabled: false,
      transitionDuration: 1500,
      width: width,
      wordCountKey: WORD_COUNT_KEY,
      wordKey: WORD_KEY,
      words: keywords
    };

    return noData ? (
      <h1>NO DATA</h1>
    ) : (
      <div className="wordcloud">
        <ReactWordCloud {...reactWordCloudProps} />
      </div>
    );
  }
}

export default WordCloud;