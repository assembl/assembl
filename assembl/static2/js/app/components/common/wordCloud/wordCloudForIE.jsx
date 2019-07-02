// @flow
import React, { Fragment } from 'react';
// Type imports
import type { Keyword, Keywords } from '../../../pages/semanticAnalysis/dataType';

export type Props = {
  /** Array of Keywords */
  keywords: Keywords,
  /** Optional maximum number of keywords to show */
  numberOfKeywordsToDisplay: number,
  /** Optional function called when a word is clicked */
  onKeywordClick: (word: Keyword) => void
};

const DEFAULT_NUMBER_OF_KEYWORDS_TO_DISPLAY = 20;
const KEYWORD_MIN_FONT_SIZE = 10;
const KEYWORD_MAX_FONT_SIZE = 50;

const style = {
  cursor: 'pointer'
};

/**
 * Function that generates the font size for a keyword, the font size value should be
 * betwwen KEYWORD_MIN_FONT_SIZE and KEYWORD_MAX_FONT_SIZE
 *
 * @param {Int} score keyword score use to compute the font weight from a base KEYWORD_REM
 */
const computeFontSize = (score: number) => {
  let fontSize: number = Math.max(KEYWORD_MIN_FONT_SIZE * score / 2, KEYWORD_MIN_FONT_SIZE);
  fontSize = fontSize > KEYWORD_MIN_FONT_SIZE ? Math.min(fontSize, KEYWORD_MAX_FONT_SIZE) : KEYWORD_MIN_FONT_SIZE;
  return Math.ceil(fontSize);
};

/**
 * Function that generates a keyword embedded in an anchor in a paragraph
 *
 * @param {Keyword} k Current keyword
 * @param {Int} i Current keyword index used as key to avoid duplicate React entries
 */
const keyword = (k: Keyword, i: number, onKeywordClick: (word: Keyword) => void) => (
  <div key={i} style={{ ...style, fontSize: `${computeFontSize(k.score)}px` }} onClick={() => onKeywordClick(k)}>
    <a>{k.value}</a>
  </div>
);

const WordCloudForIE = ({ keywords, numberOfKeywordsToDisplay, onKeywordClick }: Props) => {
  // Health check on the number of keywords to display
  const sliceEndIndex = numberOfKeywordsToDisplay > keywords.length ? keywords.length : numberOfKeywordsToDisplay;
  return <Fragment>{keywords.slice(0, sliceEndIndex).map((k, i) => keyword(k, i, onKeywordClick))}</Fragment>;
};

WordCloudForIE.defaultProps = {
  numberOfKeywordsToDisplay: DEFAULT_NUMBER_OF_KEYWORDS_TO_DISPLAY,
  onKeywordClick: () => {}
};

export default WordCloudForIE;