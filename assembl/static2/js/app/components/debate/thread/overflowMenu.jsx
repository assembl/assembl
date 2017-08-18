import React from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

import { editMessageTooltip, deleteMessageTooltip } from '../../common/tooltips';
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
  const overflowMenu = (
    <Popover id="edit-delete-actions" className="overflow-menu">
      <div className="overflow-menu-container">
        {userCanDeleteThisMessage
          ? <OverlayTrigger placement="right" overlay={deleteMessageTooltip}>
            <Link
              className="overflow-menu-action"
              onClick={() => {
                return confirmModal(postId, client);
              }}
            >
              <span className="assembl-icon-delete" />
            </Link>
          </OverlayTrigger>
          : null}
        {userCanEditThisMessage
          ? <OverlayTrigger placement="right" overlay={editMessageTooltip}>
            <Link className="overflow-menu-action" onClick={handleEditClick}>
              <span className="assembl-icon-edit" />
            </Link>
          </OverlayTrigger>
          : null}
      </div>
    </Popover>
  );
  return overflowMenu;
};

export default getOverflowMenuForPost;