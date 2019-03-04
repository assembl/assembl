// @flow
import React from 'react';
// Helpers imports
import { I18n } from 'react-redux-i18n';

export type Props = {
  /** Flag that checks whether we have to display the admin mode */
  isAdmin?: boolean,
  /** List of tags manually set by a consultant */
  tagList: Array<string>
};

const TagContainer = ({ isAdmin, tagList }: Props) => {
  const tagContainerTitle = isAdmin
    ? I18n.t('debate.tagOnPost.tagContainerAdminTitle')
    : I18n.t('debate.tagOnPost.tagContainerTitle');

  const displayTagList = tagList.map((tag, index) => <span key={`tag-${index}`}>{tag}</span>);

  return (
    <div className="tag-container">
      <div className="title">{tagContainerTitle}</div>
      <div className="tag-list">{displayTagList}</div>
    </div>
  );
};

TagContainer.defaultProps = {
  isAdmin: false
};

export default TagContainer;