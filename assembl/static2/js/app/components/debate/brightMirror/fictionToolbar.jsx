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

export type FictionToolbarProps = {
  /** Fiction identifier */
  fictionId: string,
  /** Fiction title */
  title: string,
  /** Fiction content */
  originalBody: string,
  /** Fiction locale */
  lang: string,
  /** Boolean to tell if user can edit */
  userCanEdit: boolean,
  /** Edit fiction callback, should only be set when current user is the author of the fiction */
  onModifyCallback?: () => void,
  /** Boolean to tell if user can delete */
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
          childrenUpdate={false}
          bodyMaxLength={NO_BODY_LENGTH}
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