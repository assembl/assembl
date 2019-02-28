// @flow
import React from 'react';

export type Props = {
  /** List of suggestions fetched from the semantic analysis engine (IBM Watson) */
  suggestionList: Array<string>
};

const SuggestionContainer = ({ suggestionList }: Props) => (
  <div className="suggestion-container">
    <div className="title">Suggestions de mots-clés :</div>
    <div className="suggestion-list">
      {suggestionList.map((suggestion, index) => <span key={`suggestion-${index}`}>{suggestion}</span>)}
    </div>
  </div>
);

export default SuggestionContainer;