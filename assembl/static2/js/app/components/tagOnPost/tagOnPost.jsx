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

const tagContainerProps: TagContainerProps = {
  tagList: ['Habitat et SDF', 'Facilitation']
};

const suggestionContainerProps: SuggestionContainerProps = {
  suggestionContainerTitle: I18n.t('debate.tagOnPost.suggestionContainerTitle'),
  suggestionList: ['Investissement', 'Mesures', 'Inclusive', 'Application', 'Faisabilité']
};

const TagOnPost = () => (
  <div className="tag-on-post-container">
    <TagContainer {...tagContainerProps} />
    <SuggestionContainer {...suggestionContainerProps} />
  </div>
);

export default TagOnPost;