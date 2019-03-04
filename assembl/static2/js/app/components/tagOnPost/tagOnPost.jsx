// @flow
import React from 'react';
// Helpers imports
import { I18n } from 'react-redux-i18n';
// Component imports
import TagContainer from '../common/tagContainer/tagContainer';
import SuggestionContainer from '../common/suggestionContainer/suggestionContainer';
// Type imports
import type { Props as TagContainerProps } from '../common/tagContainer/tagContainer';
import type { Props as SuggestionContainerProps } from '../common/suggestionContainer/suggestionContainer';
import type { Keywords } from '../../pages/semanticAnalysis/dataType';
import { KEYWORD_SCORE_THRESHOLD } from '../../constants';

export type Props = {
  /** List of suggested keywords fetched from IBM Watson for the current post */
  suggestedKeywords: Keywords
};

const TagOnPost = ({ suggestedKeywords }: Props) => {
  const tagContainerProps: TagContainerProps = {
    tagList: ['Habitat et SDF', 'Facilitation']
  };

  const filteredSuggestedKeywords = suggestedKeywords.reduce((result, keyword) => {
    if (keyword.score > KEYWORD_SCORE_THRESHOLD) {
      return result.concat(keyword.value);
    }
    return result;
  }, []);

  const suggestionContainerProps: SuggestionContainerProps = {
    suggestionContainerTitle: I18n.t('debate.tagOnPost.suggestionContainerTitle'),
    suggestionList: filteredSuggestedKeywords
  };

  return (
    <div className="tag-on-post-container">
      <TagContainer {...tagContainerProps} />
      <SuggestionContainer {...suggestionContainerProps} />
    </div>
  );
};

export default TagOnPost;