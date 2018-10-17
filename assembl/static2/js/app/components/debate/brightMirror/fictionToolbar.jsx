// @flow
import React from 'react';
// Constant imports
import { NO_BODY_LENGTH } from '../common/topPostForm';
// Utils imports
import { displayCustomModal, closeModal } from '../../../utils/utilityManager';
// Components imports
import EditPostButton from '../common/editPostButton';
import EditPostForm from '../common/editPostForm';
import DeletePostButton from '../common/deletePostButton';
import { PublicationStates } from '../../../constants';

export type FictionToolbarProps = {
  fictionId: string,
  title: string,
  originalBody: string,
  lang: string,
  /** Publication State */
  publicationState: string,
  userCanEdit: boolean,
  /** Edit fiction callback, should only be set when current user is the author of the fiction */
  onModifyCallback?: () => void,
  userCanDelete: boolean,
  /** Delete fiction callback, should only be set when current user is either the author of the fiction or an admin */
  onDeleteCallback?: () => void
};

const FictionToolbar = ({
  fictionId,
  title,
  originalBody,
  lang,
  userCanEdit,
  publicationState,
  onModifyCallback,
  userCanDelete,
  onDeleteCallback
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

  return (
    <div className="action-buttons">
      {userCanEdit ? <EditPostButton handleClick={openPostModal} linkClassName="edit" /> : null}
      {userCanDelete ? (
        <DeletePostButton
          postId={fictionId}
          linkClassName="delete"
          modalBodyMessage="debate.brightMirror.deleteFictionModalBody"
          onDeleteCallback={onDeleteCallback}
        />
      ) : null}
    </div>
  );
};

FictionToolbar.defaultProps = {
  onModifyCallback: null,
  onDeleteCallback: null
};

export default FictionToolbar;