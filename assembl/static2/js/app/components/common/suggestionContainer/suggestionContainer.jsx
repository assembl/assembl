// @flow
import React from 'react';

export type Props = {
  /** Suggestion container classname prefix. Default is 'suggestion' */
  suggestionContainerClassnamePrefix?: string,
  /** Suggestion container title */
  suggestionContainerTitle: string,
  /** List of suggestions fetched from the semantic analysis engine (IBM Watson) */
  suggestionList: Array<string>
};

const SuggestionContainer = ({ suggestionList, suggestionContainerClassnamePrefix, suggestionContainerTitle }: Props) =>
  (suggestionContainerClassnamePrefix ? (
    <div className={`${suggestionContainerClassnamePrefix}-container`}>
      <div className="title">{suggestionContainerTitle}</div>
      <div className={`${suggestionContainerClassnamePrefix}-list`}>
        {suggestionList.map((suggestion, index) => (
          <span key={`${suggestionContainerClassnamePrefix}-${index}`}>{suggestion}</span>
        ))}
      </div>
    </div>
  ) : null);

SuggestionContainer.defaultProps = {
  suggestionContainerClassnamePrefix: 'suggestion'
};

export default SuggestionContainer;