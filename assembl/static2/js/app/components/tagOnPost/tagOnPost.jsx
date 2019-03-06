// @flow
import React, { Component } from 'react';
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

type State = {
  /** List of tags related to the current post */
  tagList: Array<TagProps>
};

class TagOnPost extends Component<Props, State> {
  state = {
    tagList: this.props.tagList
  };

  // Callback called when a tag is added or deleted
  onTagListUpdateHandler = (tagList: Array<TagProps>) => this.setState({ tagList: tagList });

  render() {
    const { tagList } = this.state;
    const { isAdmin, postId, suggestedTagList } = this.props;

    const tagContainerProps: TagContainerProps = {
      isAdmin: isAdmin,
      postId: postId,
      tagList: tagList,
      onTagListUpdateCallback: tags => this.onTagListUpdateHandler(tags)
    };

    // Difference between tagList and suggestedTagList to hide in SuggestionContainer manually added suggested tags
    const formattedTagList = tagList.map(tag => tag.text.toLowerCase());
    const filteredSuggestedTagList = suggestedTagList.filter(
      suggestedTag => !formattedTagList.includes(suggestedTag.toLowerCase())
    );

    const suggestionContainerProps: SuggestionContainerProps = {
      suggestionContainerTitle: I18n.t('debate.tagOnPost.suggestionContainerTitle'),
      suggestionList: filteredSuggestedTagList
    };

    // Display tag container when there are tags to display
    const displayTagContainer = tagList.length > 0 || isAdmin ? <TagContainer {...tagContainerProps} /> : null;

    // Display suggestion container when there are suggested tags to display
    const displaySuggestionContainer =
      filteredSuggestedTagList.length > 0 && isAdmin ? <SuggestionContainer {...suggestionContainerProps} /> : null;

    return (
      <div className="tag-on-post-container">
        {displayTagContainer}
        {displaySuggestionContainer}
      </div>
    );
  }
}

export default TagOnPost;