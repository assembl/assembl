// @flow
import React from 'react';

// Component imports
import TagContainer from '../common/tagContainer/tagContainer';
import SuggestionContainer from '../common/suggestionContainer/suggestionContainer';

// Data imports
import { defaultProps as suggestionContainerProps } from '../common/suggestionContainer/suggestionContainer.stories';

const TagOnPost = () => (
  <div className="tag-on-post-container">
    <TagContainer />
    <SuggestionContainer {...suggestionContainerProps} />
  </div>
);

export default TagOnPost;