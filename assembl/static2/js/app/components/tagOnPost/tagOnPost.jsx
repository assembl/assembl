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

export type Props = {
  /** Flag that check if the current user is an admin */
  isAdmin: boolean,
  /** Post ID */
  postId: string,
  /** List of suggested keywords related to the current post */
  suggestedKeywords: Array<string>,
  /** List of tags fetched related to the current post */
  tagList: Array<Tag>
};

const TagOnPost = ({ postId, suggestedKeywords, tagList }: Props) => {
  const tagContainerProps: TagContainerProps = {
    postId: postId,
    tagList: tagList
  };

  const suggestionContainerProps: SuggestionContainerProps = {
    suggestionContainerTitle: I18n.t('debate.tagOnPost.suggestionContainerTitle'),
    suggestionList: suggestedKeywords
  };

  return (
    <div className="tag-on-post-container">
      <TagContainer {...tagContainerProps} />
      <SuggestionContainer {...suggestionContainerProps} />
    </div>
  );
};

export default TagOnPost;