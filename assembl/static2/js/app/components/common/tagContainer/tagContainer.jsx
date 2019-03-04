// @flow
import React from 'react';
// Helpers imports
import { I18n } from 'react-redux-i18n';
// Component import
import Tags from '../tags/tags';

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

  const tagsList = tagList.map(tag => ({ id: tag, text: tag }));
  const displayTagList = <Tags tagsList={tagsList} isAdmin={isAdmin} alreadyAdded={I18n.t('debate.tagOnPost.alreadyAdded')} />;

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