// @flow
// we need to import this way to be able to use React.Node type
// (see https://shaneosullivan.wordpress.com/2018/03/22/using-react-types-with-flow/)
import * as React from 'react';
import { Popover } from 'react-bootstrap';
import { editMessageTooltip, deleteMessageTooltip } from '../../common/tooltips';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import DeletePostButton from './deletePostButton';
import EditPostButton from './editPostButton';

const getOverflowMenuForPost = (
  postId: string,
  userCanDeleteThisMessage: boolean,
  userCanEditThisMessage: boolean,
  handleEditClick: Function
): React.Node => {
  const deleteButton = (
    <span>
      <DeletePostButton postId={postId} linkClassName="overflow-menu-action" />
    </span>
  );
  const editButton = (
    <span>
      <EditPostButton handleClick={handleEditClick} linkClassName="overflow-menu-action" />
    </span>
  );
  return (
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
};

export default getOverflowMenuForPost;