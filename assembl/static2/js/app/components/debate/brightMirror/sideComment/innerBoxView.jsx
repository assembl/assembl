// @flow
import React, { Fragment } from 'react';

import moment from 'moment';
import activeHtml from 'react-active-html';
import { I18n } from 'react-redux-i18n';
import { Button, OverlayTrigger, Popover, Overlay } from 'react-bootstrap';

import AvatarImage from '../../../common/avatarImage';
import { transformLinksInHtml /* getUrls */ } from '../../../../utils/linkify';
import { postBodyReplacementComponents } from '../../common/post/postBody';
import { isConnectedUser } from '../../../../utils/globalFunctions';
import { editSideCommentTooltip, deleteSideCommentTooltip } from '../../../common/tooltips';
import Permissions, { connectedUserCan } from '../../../../utils/permissions';

export type Props = {
  contentLocale: string,
  extractIndex: number,
  extracts?: Array<FictionExtractFragment>,
  comment: ExtractCommentFragment,
  changeCurrentExtract?: (?number) => void,
  setEditMode: (string, string) => void,
  deletePost: (ExtractCommentFragment, string) => void
};

export type State = {
  menuTarget: HTMLElement | null
};

const renderRichtext = (text: string) => activeHtml(text && transformLinksInHtml(text), postBodyReplacementComponents());

class InnerBoxView extends React.Component<Props, State> {
  static defaultProps = {
    extractIndex: 0
  };

  state = {
    menuTarget: null
  };

  render() {
    const { contentLocale, extractIndex, extracts, comment, changeCurrentExtract, setEditMode, deletePost } = this.props;
    const { menuTarget } = this.state;
    const { creator } = comment;
    const displayName = creator && !creator.isDeleted ? creator.displayName : I18n.t('deletedUser');
    const canEdit = isConnectedUser(creator && creator.userId) && connectedUserCan(Permissions.EDIT_MY_POST);
    const canDelete =
      (isConnectedUser(creator && creator.userId) && connectedUserCan(Permissions.DELETE_MY_POST)) ||
      connectedUserCan(Permissions.DELETE_POST);
    const currentExtractId = extracts ? extracts[extractIndex].id : '';
    const canGoPrevious = extracts && extractIndex != null && extractIndex > 0;
    const canGoNext = extracts && extractIndex != null && extractIndex < extracts.length - 1;

    const displayPreviousArrow =
      canGoPrevious && changeCurrentExtract ? (
        <div
          className="previous-extract"
          onClick={() => {
            changeCurrentExtract(-1);
          }}
        >
          <span className="assembl-icon-down-open grey" />
        </div>
      ) : (
        <div className="previous-extract empty" />
      );

    const displayNextArrow =
      canGoNext && changeCurrentExtract ? (
        <div
          className="next-extract"
          onClick={() => {
            changeCurrentExtract(1);
          }}
        >
          <span className="assembl-icon-down-open grey" />
        </div>
      ) : (
        <div className="next-extract empty" />
      );

    return (
      <Fragment>
        <div className="harvesting-box-header">
          <div className="profile">
            <AvatarImage userId={creator && creator.userId} userName={displayName} />
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
                  <Popover id="tools" className="tools-menu overflow-menu">
                    <div>
                      {canEdit ? (
                        <OverlayTrigger placement="top" overlay={editSideCommentTooltip}>
                          <Button onClick={() => setEditMode && setEditMode(comment.id, comment.body || '')} className="edit-btn">
                            <span className="assembl-icon-edit grey" />
                          </Button>
                        </OverlayTrigger>
                      ) : null}
                      {canDelete ? (
                        <OverlayTrigger placement="top" overlay={deleteSideCommentTooltip}>
                          <Button onClick={() => deletePost(comment, currentExtractId)} className="delete-btn">
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
            {displayPreviousArrow}
            <div className="extract-body">{renderRichtext(comment.body || '')}</div>
            {displayNextArrow}
          </div>
        </div>
      </Fragment>
    );
  }
}

export default InnerBoxView;