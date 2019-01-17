// @flow
import * as React from 'react';

import ReactWordCloud from 'react-wordcloud';

import type { Keyword, Keywords } from '../../../integration/semanticAnalysis/typeData';

const WORD_COUNT_KEY = 'relevance';
const WORD_KEY = 'text';

export type Props = {
  /** Optional height */
  height: number,
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
  onWordClick: (word: Keyword) => void,
  /** Optional width */
  width: number
};

class Wordcloud extends React.Component<Props> {
  static defaultProps = {
    height: 500,
    keywordsAngle: 0,
    keywordsColor: '0, 0, 0',
    numberOfKeywordsToDisplay: 30,
    onMouseOutWord: () => {},
    onMouseOverWord: () => {},
    onWordClick: () => {},
    width: 400
  };

  shouldComponentUpdate(nextProps: Props) {
    const {
      height,
      keywordsAngle,
      keywordsColor,
      keywords,
      numberOfKeywordsToDisplay,
      onMouseOutWord,
      onMouseOverWord,
      onWordClick,
      width
    } = this.props;
    if (
      nextProps.height !== height ||
      nextProps.keywordsAngle !== keywordsAngle ||
      nextProps.keywordsColor !== keywordsColor ||
      nextProps.keywords !== keywords ||
      nextProps.numberOfKeywordsToDisplay !== numberOfKeywordsToDisplay ||
      nextProps.onMouseOutWord !== onMouseOutWord ||
      nextProps.onMouseOverWord !== onMouseOverWord ||
      nextProps.onWordClick !== onWordClick ||
      nextProps.width !== width
    ) {
      return true;
    }
    return false;
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.keywordsColor !== prevProps.keywordsColor) this.forceUpdate();
  }

  render() {
    const {
      height,
      keywordsAngle,
      keywordsColor,
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
      max: Math.max(...Array.from(keywords, x => x.relevance)),
      min: Math.min(...Array.from(keywords, x => x.relevance))
    };
    if (interval.max === interval.min) {
      interval.max = 1;
      interval.min = 0;
    }

    const colorFunction = d =>
      `rgba(${keywordsColor}, ${0.5 + 0.5 * (d.relevance - interval.min) / (interval.max - interval.min)})`;

    return noData ? (
      <h1>NO DATA</h1>
    ) : (
      <div className="wordcloud">
        <ReactWordCloud
          colorScale={colorFunction}
          fontFamily="Lato"
          height={height}
          maxAngle={maxAngle}
          maxWords={numberOfKeywordsToDisplay}
          minAngle={minAngle}
          onMouseOutWord={word => onMouseOutWord(word)}
          onMouseOverWord={word => onMouseOverWord(word)}
          onWordClick={word => onWordClick(word)}
          orientations={20}
          scale={'linear'}
          tooltipEnabled={false}
          transitionDuration={1500}
          width={width}
          wordCountKey={WORD_COUNT_KEY}
          wordKey={WORD_KEY}
          words={keywords}
        />
      </div>
    );
  }
}

export default Wordcloud;