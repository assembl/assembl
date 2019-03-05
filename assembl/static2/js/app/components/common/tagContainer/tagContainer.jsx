// @flow
import React from 'react';
// Helpers imports
import { I18n } from 'react-redux-i18n';
// Component import
import Tags from '../tags/tags';

export type Props = {
  postId: string,
  /** Flag that checks whether we have to display the admin mode */
  isAdmin: boolean
};

const TagContainer = ({ postId, isAdmin }: Props) => {
  const tagContainerTitle = isAdmin
    ? I18n.t('debate.tagOnPost.tagContainerAdminTitle')
    : I18n.t('debate.tagOnPost.tagContainerTitle');

  const displayTagList = <Tags postId={postId} isAdmin={isAdmin} alreadyAdded={I18n.t('debate.tagOnPost.alreadyAdded')} />;

  return (
    <div className="tag-container">
      <div className="title">{tagContainerTitle}</div>
      <div className="tag-list">{displayTagList}</div>
    </div>
  );
};

export default TagContainer;