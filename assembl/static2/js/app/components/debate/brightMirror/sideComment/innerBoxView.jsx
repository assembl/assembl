// @flow
import React, { Fragment } from 'react';

import moment from 'moment';
import activeHtml from 'react-active-html';
import { I18n } from 'react-redux-i18n';
import { Button, OverlayTrigger, Popover, Overlay } from 'react-bootstrap';
import classnames from 'classnames';

import AvatarImage from '../../../common/avatarImage';
import { transformLinksInHtml /* getUrls */ } from '../../../../utils/linkify';
import { postBodyReplacementComponents } from '../../common/post/postBody';
import { getConnectedUserId } from '../../../../utils/globalFunctions';
import { editSideCommentTooltip, deleteSideCommentTooltip } from '../../../common/tooltips';
import Permissions, { connectedUserCan } from '../../../../utils/permissions';

export type Props = {
  contentLocale: string,
  extractIndex: ?number,
  extracts: ?Array<FictionExtractFragment>,
  comment: ExtractComment,
  changeCurrentExtract: (?number) => void,
  setEditMode: ?(number, string) => void,
  deletePost: ?(ExtractComment, number) => void
};

export type State = {
  menuTarget: HTMLElement | null
};

const renderRichtext = (text: string) => activeHtml(text && transformLinksInHtml(text), postBodyReplacementComponents());

class InnerBoxView extends React.Component<Props, State> {
  state = {
    menuTarget: null
  };

  render() {
    const { contentLocale, extractIndex, extracts, comment, changeCurrentExtract, setEditMode, deletePost } = this.props;
    const { menuTarget } = this.state;
    const { creator } = comment;
    const displayName = creator && !creator.isDeleted ? creator.displayName : I18n.t('deletedUser');
    const canEdit =
      creator &&
      String(creator.userId) === getConnectedUserId() &&
      connectedUserCan(Permissions.EDIT_MY_POST) &&
      // Prevent editing reply for now (will be added in another ticket)
      setEditMode;
    const canDelete =
      (creator && String(creator.userId) === getConnectedUserId() && connectedUserCan(Permissions.DELETE_MY_POST)) ||
      connectedUserCan(Permissions.DELETE_POST);

    return (
      <Fragment>
        <div className="harvesting-box-header">
          <div className="profile">
            <AvatarImage userId={comment.creator.userId} userName={displayName} />
            <div className="harvesting-infos">
              <div className="username">{displayName}</div>
              <div className="harvesting-date" title={comment.creationDate}>
                {moment(comment.creationDate)
                  .locale(contentLocale)
                  .fromNow()}
              </div>
            </div>
          </div>
          {(canEdit || canDelete) && (
            <div className="button-bar">
              <Button
                className="action-menu-btn"
                onClick={(e) => {
                  this.setState({ menuTarget: !menuTarget ? e.target : null });
                }}
              >
                <span className="assembl-icon-ellipsis-vert grey" />
              </Button>
              {menuTarget && (
                <Overlay show target={menuTarget} placement="bottom">
                  <Popover id="tools" className={classnames('tools-menu overflow-menu', { multiple: canEdit && canDelete })}>
                    <div>
                      {canEdit ? (
                        <OverlayTrigger placement="top" overlay={editSideCommentTooltip}>
                          <Button onClick={() => setEditMode(comment.id, comment.body)} className="edit-btn">
                            <span className="assembl-icon-edit grey" />
                          </Button>
                        </OverlayTrigger>
                      ) : null}
                      {canDelete ? (
                        <OverlayTrigger placement="top" overlay={deleteSideCommentTooltip}>
                          <Button
                            onClick={() => deletePost(comment, extracts && extracts[extractIndex].id)}
                            className="delete-btn"
                          >
                            <span className="assembl-icon-delete grey" />
                          </Button>
                        </OverlayTrigger>
                      ) : null}
                    </div>
                  </Popover>
                </Overlay>
              )}
            </div>
          )}
        </div>
        <div className="harvesting-box-body">
          <div className="body-container">
            <div className="previous-extract">
              {extracts &&
                extractIndex > 0 && (
                  <div
                    onClick={() => {
                      changeCurrentExtract(-1);
                    }}
                  >
                    <span className="assembl-icon-down-open grey" />
                  </div>
                )}
            </div>
            <div className="extract-body">{renderRichtext(comment.body)}</div>
            <div className="next-extract">
              {extracts &&
                extractIndex < extracts.length - 1 && (
                  <div
                    onClick={() => {
                      changeCurrentExtract(1);
                    }}
                  >
                    <span className="assembl-icon-down-open grey" />
                  </div>
                )}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default InnerBoxView;