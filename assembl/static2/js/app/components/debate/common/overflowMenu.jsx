import React from 'react';
import { Button, Popover } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';
import { editMessageTooltip, deleteMessageTooltip } from '../../common/tooltips';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { displayModal, closeModal } from '../../../utils/utilityManager';
import deletePostMutation from '../../../graphql/mutations/deletePost.graphql';

const confirmModal = (postId, client) => {
  const title = <Translate value="debate.confirmDeletionTitle" />;
  const body = <Translate value="debate.confirmDeletionBody" />;
  const footer = [
    <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
      <Translate value="debate.confirmDeletionButtonCancel" />
    </Button>,
    <Button
      key="delete"
      onClick={() => {
        client.mutate({ mutation: deletePostMutation, variables: { postId: postId } });
        closeModal();
      }}
      className="button-submit button-dark"
    >
      <Translate value="debate.confirmDeletionButtonDelete" />
    </Button>
  ];
  const includeFooter = true;
  return displayModal(title, body, includeFooter, footer);
};

const getOverflowMenuForPost = (postId, userCanDeleteThisMessage, userCanEditThisMessage, client, handleEditClick) => {
  const deleteButton = (
    <Link className="overflow-menu-action" onClick={() => confirmModal(postId, client)}>
      <span className="assembl-icon-delete" />
    </Link>
  );
  const editButton = (
    <Link className="overflow-menu-action" onClick={handleEditClick}>
      <span className="assembl-icon-edit" />
    </Link>
  );
  const overflowMenu = (
    <Popover id="edit-delete-actions" className="overflow-menu">
      <div className="overflow-menu-container">
        {userCanDeleteThisMessage ? (
          <ResponsiveOverlayTrigger placement="right" tooltip={deleteMessageTooltip} component={deleteButton} />
        ) : null}
        {userCanEditThisMessage ? (
          <ResponsiveOverlayTrigger placement="right" tooltip={editMessageTooltip} component={editButton} />
        ) : null}
      </div>
    </Popover>
  );
  return overflowMenu;
};

export default getOverflowMenuForPost;