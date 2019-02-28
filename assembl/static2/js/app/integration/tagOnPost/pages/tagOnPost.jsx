// @flow
import React from 'react';

// Component imports
import TagContainer from '../../../components/common/tagContainer/tagContainer';
import SuggestionContainer from '../../../components/common/suggestionContainer/suggestionContainer';

// Data imports
import { defaultProps as suggestionContainerProps } from '../../../components/common/suggestionContainer/suggestionContainer.stories';

const TagOnPost = () => (
  <div className="tag-on-post-container">
    <TagContainer />
    <SuggestionContainer {...suggestionContainerProps} />
  </div>
);

export default TagOnPost;