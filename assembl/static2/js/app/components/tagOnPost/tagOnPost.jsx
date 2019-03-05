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
import type { TagProps } from '../common/tags/tags';

export type Props = {
  /** Flag that check if the current user is an admin */
  isAdmin: boolean,
  /** Post ID */
  postId: string,
  /** List of suggested tags related to the current post (from IBM Watson) */
  suggestedTagList: Array<string>,
  /** List of tags related to the current post */
  tagList: Array<TagProps>
};

const TagOnPost = ({ isAdmin, postId, suggestedTagList, tagList }: Props) => {
  const tagContainerProps: TagContainerProps = {
    isAdmin: isAdmin,
    postId: postId,
    tagList: tagList
  };

  const suggestionContainerProps: SuggestionContainerProps = {
    suggestionContainerTitle: I18n.t('debate.tagOnPost.suggestionContainerTitle'),
    suggestionList: suggestedTagList
  };

  // Display tag container when there are tags to display
  const displayTagContainer = tagList.length > 0 || isAdmin ? <TagContainer {...tagContainerProps} /> : null;

  // Display suggestion container when there are suggested tags to display
  const displaySuggestionContainer =
    suggestedTagList.length > 0 && isAdmin ? <SuggestionContainer {...suggestionContainerProps} /> : null;

  // Display tag on post container when there are tags or suggested tags to display
  const displayTagOnPostContainer =
    tagList.length > 0 || suggestedTagList.length > 0 ? (
      <div className="tag-on-post-container">
        {displayTagContainer}
        {displaySuggestionContainer}
      </div>
    ) : null;

  return displayTagOnPostContainer;
};

export default TagOnPost;