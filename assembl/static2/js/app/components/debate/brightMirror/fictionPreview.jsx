// @flow
import * as React from 'react';
import { Link } from 'react-router';
import { I18n } from 'react-redux-i18n';
import classNames from 'classnames';
// Constant imports
import { PublicationStates } from '../../../constants';
import { NO_BODY_LENGTH } from '../common/topPostForm';
// Components imports
import EditPostForm from '../common/editPostForm';
import EditPostButton from '../common/editPostButton';
import DeletePostButton from '../common/deletePostButton';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { editFictionTooltip, deleteFictionTooltip } from '../../common/tooltips';
// Utils imports
import { displayCustomModal, closeModal } from '../../../utils/utilityManager';

export type FictionPreviewProps = {
  id: string,
  title: ?string,
  authorName: ?string,
  creationDate: string,
  link: string,
  /** Background color */
  color: string,
  originalBody: string,
  /** Function to refresh idea */
  refetchIdea: Function,
  lang: string,
  userCanEdit: boolean,
  userCanDelete: boolean,
  deleteFictionHandler: Function,
  publicationState: string
};

const FictionPreview = ({
  id,
  title,
  authorName,
  creationDate,
  link,
  color,
  originalBody,
  refetchIdea,
  lang,
  userCanEdit,
  userCanDelete,
  deleteFictionHandler,
  publicationState
}: FictionPreviewProps) => {
  const isDraft = publicationState === PublicationStates.DRAFT;
  // Define components
  const openPostModal = () => {
    const content = (
      <div className="fiction-edit-modal-inner">
        <EditPostForm
          id={id}
          body={originalBody}
          subject={title}
          onSuccess={refetchIdea}
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
          draftable={isDraft}
        />
      </div>
    );
    return displayCustomModal(content, true, 'fiction-edit-modal');
  };

  const editButton = userCanEdit ? (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={editFictionTooltip}>
        <EditPostButton handleClick={openPostModal} linkClassName="edit" />
      </ResponsiveOverlayTrigger>
    </li>
  ) : null;

  const deleteButton = userCanDelete ? (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={deleteFictionTooltip}>
        <DeletePostButton
          postId={id}
          modalBodyMessage="debate.brightMirror.deleteFictionModalBody"
          onDeleteCallback={deleteFictionHandler}
        />
      </ResponsiveOverlayTrigger>
    </li>
  ) : null;

  // Format author name
  const name = authorName || '';
  const date = ` - ${creationDate}`;

  return (
    <div className={classNames('fiction-preview', { draft: isDraft })} style={{ backgroundColor: color }}>
      <div className="content-box">
        {isDraft ? <span className="draft-label">{I18n.t('debate.brightMirror.draftLabel')}</span> : null}
        <ul className="actions">
          {editButton}
          {deleteButton}
        </ul>
        <Link className="link" to={link}>
          <div className="inner-box">
            <h3>{title}</h3>
            <p className="info">
              <span className="author">{name}</span>
              <span className="published-date">{date}</span>
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default FictionPreview;