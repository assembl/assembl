// @flow
import React from 'react';
// Constant imports
import { NO_BODY_LENGTH } from '../common/topPostForm';
import { PublicationStates } from '../../../constants';
// Utils imports
import { displayCustomModal, closeModal } from '../../../utils/utilityManager';
// Components imports
import EditPostButton from '../common/editPostButton';
import EditPostForm from '../common/editPostForm';
import DeletePostButton from '../common/deletePostButton';
import SharePostButton from '../common/sharePostButton';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { editFictionTooltip, deleteFictionTooltip, shareFictionTooltip } from '../../common/tooltips';
// Type imports
import type { Props as EditPostButtonProps } from '../common/editPostButton';
import type { Props as DeletePostButtonProps } from '../common/deletePostButton';
import type { Props as SharePostButtonProps } from '../common/sharePostButton';
import type { BrightMirrorFictionProps } from '../../../pages/brightMirrorFiction';

export type FictionToolbarProps = {
  fictionId: string,
  /** Fiction meta information: slug, phase, themeId, fictionId */
  fictionMetaInfo: BrightMirrorFictionProps,
  lang: string,
  /** Delete fiction callback, should only be set when current user is either the author of the fiction or an admin */
  onDeleteCallback?: () => void,
  /** Edit fiction callback, should only be set when current user is the author of the fiction */
  onModifyCallback?: () => void,
  originalBody: string,
  /** Publication State */
  publicationState: string,
  title: string,
  userCanDelete: boolean,
  userCanEdit: boolean
};

const FictionToolbar = ({
  fictionId,
  fictionMetaInfo,
  lang,
  onDeleteCallback,
  onModifyCallback,
  originalBody,
  publicationState,
  title,
  userCanDelete,
  userCanEdit
}: FictionToolbarProps) => {
  const openPostModal = () => {
    const content = (
      <div className="fiction-edit-modal-inner">
        <EditPostForm
          id={fictionId}
          body={originalBody}
          subject={title}
          onSuccess={onModifyCallback}
          goBackToViewMode={() => closeModal()}
          readOnly={false}
          modifiedOriginalSubject={null}
          originalLocale={lang}
          postSuccessMsgId="debate.brightMirror.postSuccessMsg"
          editTitleLabelMsgId="debate.brightMirror.editFiction"
          bodyDescriptionMsgId="debate.brightMirror.fiction"
          fillBodyLabelMsgId="debate.brightMirror.fillBodyLabel"
          draftSuccessMsgId="debate.brightMirror.draftSuccessMsg"
          childrenUpdate={false}
          bodyMaxLength={NO_BODY_LENGTH}
          draftable={publicationState === PublicationStates.DRAFT}
        />
      </div>
    );
    return displayCustomModal(content, true, 'fiction-edit-modal');
  };

  const editPostButtonProps: EditPostButtonProps = {
    handleClick: openPostModal,
    linkClassName: 'edit'
  };

  const deletePostButtonProps: DeletePostButtonProps = {
    postId: fictionId,
    linkClassName: 'delete',
    modalBodyMessage: 'debate.brightMirror.deleteFictionModalBody',
    onDeleteCallback: onDeleteCallback
  };

  const sharePostButtonProps: SharePostButtonProps = {
    linkClassName: 'share',
    routerParams: { ...fictionMetaInfo },
    modalTitleMsgKey: 'debate.brightMirror.shareFiction',
    type: 'brightMirrorFiction'
  };

  const editPostButton = userCanEdit ? (
    <ResponsiveOverlayTrigger placement="left" tooltip={editFictionTooltip}>
      <EditPostButton {...editPostButtonProps} />
    </ResponsiveOverlayTrigger>
  ) : null;

  const deletePostButton = userCanDelete ? (
    <ResponsiveOverlayTrigger placement="bottom" tooltip={deleteFictionTooltip}>
      <DeletePostButton {...deletePostButtonProps} />{' '}
    </ResponsiveOverlayTrigger>
  ) : null;

  const sharePostButton = (
    <ResponsiveOverlayTrigger placement="right" tooltip={shareFictionTooltip}>
      <SharePostButton {...sharePostButtonProps} />
    </ResponsiveOverlayTrigger>
  );

  return (
    <div className="action-buttons">
      {editPostButton}
      {deletePostButton}
      {sharePostButton}
    </div>
  );
};

FictionToolbar.defaultProps = {
  onModifyCallback: () => {},
  onDeleteCallback: () => {}
};

export default FictionToolbar;