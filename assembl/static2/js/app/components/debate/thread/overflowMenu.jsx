import React from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { Translate } from 'react-redux-i18n';
import { Link } from 'react-router';

import { editMessageTooltip, deleteMessageTooltip } from '../../common/tooltips';
import { displayModal, closeModal } from '../../../utils/utilityManager';

const confirmModal = (postId) => {
  const title = <Translate value="debate.confirmDeletionTitle" />;
  const body = <Translate value="debate.confirmDeletionBody" />;
  const footer = [
    <Button key="cancel" onClick={closeModal} className="button-cancel button-dark">
      <Translate value="debate.confirmDeletionButtonCancel" />
    </Button>,
    <Button
      key="delete"
      onClick={() => {
        console.log('delete', postId); // eslint-disable-line
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

const editMessage = (postId) => {
  return console.log('edit', postId); // eslint-disable-line
};

const getOverflowMenuForPost = (postId) => {
  const overflowMenu = (
    <Popover id="edit-delete-actions" className="overflow-menu">
      <div className="overflow-menu-container">
        <OverlayTrigger placement="right" overlay={deleteMessageTooltip}>
          <Link
            className="overflow-menu-action"
            onClick={() => {
              return confirmModal(postId);
            }}
          >
            <span className="assembl-icon-delete" />
          </Link>
        </OverlayTrigger>
        <OverlayTrigger placement="right" overlay={editMessageTooltip}>
          <Link
            className="overflow-menu-action"
            onClick={() => {
              return editMessage(postId);
            }}
          >
            <span className="assembl-icon-edit" />
          </Link>
        </OverlayTrigger>
      </div>
    </Popover>
  );
  return overflowMenu;
};

export default getOverflowMenuForPost;