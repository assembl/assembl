// @flow
import * as React from 'react';

import ReactWordCloud from 'react-wordcloud';

import type { Keywords, Keyword } from '../../../integration/semanticAnalysis/typeData';

const WORD_COUNT_KEY = 'relevance';
const WORD_KEY = 'text';

export type Props = {
  keywordsAngle: number,
  keywordsColor: string,
  numberOfKeywordsToDisplay: number,
  onWordClick: (word: Keyword) => void,
  onMouseOverWord: (word: Keyword) => void,
  onMouseOutWord: (word: Keyword) => void,
  keywords: Keywords,
  height: number,
  width: number
};

class Wordcloud extends React.Component<Props> {
  static defaultProps = {
    keywordsAngle: 0,
    keywordsColor: '#000',
    numberOfKeywordsToDisplay: 30,
    onWordClick: () => {},
    onMouseOverWord: () => {},
    onMouseOutWord: () => {},
    width: 400,
    height: 500
  };

  shouldComponentUpdate(nextProps: Props) {
    const {
      keywordsAngle,
      keywordsColor,
      numberOfKeywordsToDisplay,
      onWordClick,
      onMouseOverWord,
      onMouseOutWord,
      keywords,
      width,
      height
    } = this.props;
    if (
      nextProps.keywordsAngle !== keywordsAngle ||
      nextProps.keywordsColor !== keywordsColor ||
      nextProps.numberOfKeywordsToDisplay !== numberOfKeywordsToDisplay ||
      nextProps.onWordClick !== onWordClick ||
      nextProps.keywords !== keywords ||
      nextProps.onMouseOverWord !== onMouseOverWord ||
      nextProps.onMouseOutWord !== onMouseOutWord ||
      nextProps.width !== width ||
      nextProps.height !== height
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
      keywordsAngle,
      keywordsColor,
      numberOfKeywordsToDisplay,
      onWordClick,
      onMouseOverWord,
      onMouseOutWord,
      keywords,
      width,
      height
    } = this.props;

    const noData = !keywords.length;
    const maxAngle = keywordsAngle;
    const minAngle = maxAngle * -1;

    const interval = {
      min: Math.min(...Array.from(keywords, x => x.relevance)),
      max: Math.max(...Array.from(keywords, x => x.relevance))
    };

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
          minAngle={minAngle}
          maxWords={numberOfKeywordsToDisplay}
          orientations={20}
          scale={'linear'}
          transitionDuration={1500}
          width={width}
          words={keywords}
          wordCountKey={WORD_COUNT_KEY}
          wordKey={WORD_KEY}
          onWordClick={word => onWordClick(word)}
          onMouseOverWord={word => onMouseOverWord(word)}
          onMouseOutWord={word => onMouseOutWord(word)}
          tooltipEnabled={false}
        />
      </div>
    );
  }
}

export default Wordcloud;