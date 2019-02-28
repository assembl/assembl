// @flow
import React from 'react';

// Component imports
import TagContainer from '../../../components/common/tagContainer/tagContainer';
import SuggestionContainer from '../../../components/common/suggestionContainer/suggestionContainer';

// Type imports

const TagOnPost = () => (
  <div className="tag-on-post-container">
    <TagContainer />
    <SuggestionContainer />
  </div>
);

export default TagOnPost;