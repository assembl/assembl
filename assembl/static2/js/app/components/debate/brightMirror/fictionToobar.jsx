// @flow
import React from 'react';

import DeletePostButton from '../common/deletePostButton';
import { displayCustomModal, closeModal } from '../../../utils/utilityManager';
import EditPostButton from '../common/editPostButton';
import EditPostForm from '../common/editPostForm';

export type FictionToolbarProps = {
  fictionId: string,
  onDeleteCallback: Function,
  userCanEdit: boolean,
  originalBody: string,
  title: string,
  onModifyCallback: Function,
  lang: string
};

const fictionToolbar = ({
  fictionId,
  onDeleteCallback,
  userCanEdit,
  title,
  originalBody,
  onModifyCallback,
  lang
}: FictionToolbarProps) => {
  const openPostModal = () => {
    const content = (
      <div className="fiction-edit-modal">
        <EditPostForm
          id={fictionId}
          body={originalBody}
          subject={title}
          onSuccess={onModifyCallback}
          goBackToViewMode={() => closeModal()}
          readOnly={false}
          modifiedOriginalSubject={null}
          originalLocale={lang}
          postSuccessMsg="debate.brightMirror.postSuccessMsg"
          editTitle="debate.brightMirror.editFiction"
          bodyDescription="debate.brightMirror.fiction"
          childrenUpdate={false}
        />
      </div>
    );
    return displayCustomModal(content, true);
  };

  return (
    <div className="action-buttons">
      <DeletePostButton postId={fictionId} onDeleteCallback={onDeleteCallback} />
      {userCanEdit ? <EditPostButton handleClick={openPostModal} linkClassName="edit" /> : null}
    </div>
  );
};

export default fictionToolbar;