// @flow
import React, { Fragment } from 'react';

import moment from 'moment';
import activeHtml from 'react-active-html';
import { I18n } from 'react-redux-i18n';
import { Button, OverlayTrigger, Popover, Overlay } from 'react-bootstrap';

import AvatarImage from '../../../common/avatarImage';
import { transformLinksInHtml /* getUrls */ } from '../../../../utils/linkify';
import { postBodyReplacementComponents } from '../../common/post/postBody';
import { getConnectedUserId } from '../../../../utils/globalFunctions';
import { editFictionCommentTooltip } from '../../../common/tooltips';
import Permissions, { connectedUserCan } from '../../../../utils/permissions';

export type Props = {
  contentLocale: string,
  extractIndex: number,
  extracts: ?Array<FictionExtractFragment>,
  comment: ExtractComment,
  changeCurrentExtract: (?number) => void,
  setEditMode: ?(number, string) => void
};

export type State = {
  menuTarget: HTMLElement | null
};

class InnerBoxView extends React.Component<Props, State> {
  state = {
    menuTarget: null
  };

  renderRichtext = (text: string) => activeHtml(text && transformLinksInHtml(text), postBodyReplacementComponents());

  render() {
    const { contentLocale, extractIndex, extracts, comment, changeCurrentExtract, setEditMode } = this.props;
    const { menuTarget } = this.state;
    const displayName =
      comment && comment.creator && !comment.creator.isDeleted ? comment.creator.displayName : I18n.t('deletedUser');
    const canEdit =
      comment &&
      comment.creator &&
      String(comment.creator.userId) === getConnectedUserId() &&
      connectedUserCan(Permissions.EDIT_MY_POST) &&
      // Prevent editing reply for now (will be added in another ticket)
      setEditMode;

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
            {canEdit && (
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
                    <Popover id="tools" className="tools-menu overflow-menu">
                      <div>
                        <OverlayTrigger placement="top" overlay={editFictionCommentTooltip}>
                          <Button onClick={() => setEditMode(comment.id, comment.body)} class="edit-btn">
                            <span className="assembl-icon-edit grey" />
                          </Button>
                        </OverlayTrigger>
                      </div>
                    </Popover>
                  </Overlay>
                )}
              </div>
            )}
          </div>
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
            <div className="extract-body">{comment && this.renderRichtext(comment.body)}</div>
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