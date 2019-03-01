// @flow
import React from 'react';
// Helpers imports
import { I18n } from 'react-redux-i18n';

export type Props = {
  /** List of suggestions fetched from the semantic analysis engine (IBM Watson) */
  suggestionList: Array<string>
};

const SuggestionContainer = ({ suggestionList }: Props) => {
  const suggestionContainerTitle: string = I18n.t('debate.tagOnPost.suggestionContainerTitle');

  return (
    <div className="suggestion-container">
      <div className="title">{suggestionContainerTitle}</div>
      <div className="suggestion-list">
        {suggestionList.map((suggestion, index) => <span key={`suggestion-${index}`}>{suggestion}</span>)}
      </div>
    </div>
  );
};

export default SuggestionContainer;