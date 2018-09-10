// @flow
import * as React from 'react';
import { I18n } from 'react-redux-i18n';
import { Link } from 'react-router';
import truncate from 'lodash/truncate';
// Constant imports
import { FICTION_PREVIEW_TITLE_MAX_CHAR, FICTION_PREVIEW_NAME_MAX_CHAR } from '../../../constants';
// Components imports
import EditPostForm from '../common/editPostForm';
import EditPostButton from '../common/editPostButton';
import DeletePostButton from '../common/deletePostButton';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { editFictionTooltip, deleteFictionTooltip } from '../../common/tooltips';
// Utils imports
import { displayCustomModal, closeModal, displayAlert } from '../../../utils/utilityManager';

export type FictionPreviewProps = {
  /** ID */
  id: string,
  /** Fiction title */
  title: ?string,
  /** Author fullname */
  authorName: ?string,
  /** Creation date */
  creationDate: string,
  /** Url to fiction */
  link: string,
  /** Background color */
  color: string,
  /** original body */
  originalBody: string,
  /** Function to refresh idea */
  refetchIdea: Function,
  /** Original locale */
  lang: string,
  /** Boolean to tell if user can edit */
  userCanEdit: boolean,
  /** Boolean to tell if user can delete */
  userCanDelete: boolean
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
  userCanDelete
}: FictionPreviewProps) => {
  // Define callback functions
  const deleteFictionHandler = () => {
    displayAlert('success', I18n.t('debate.brightMirror.deleteFictionSuccessMsg'));
  };

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
          postSuccessMsg="debate.brightMirror.postSuccessMsg"
          editTitle="debate.brightMirror.editFiction"
          bodyDescription="debate.brightMirror.fiction"
          childrenUpdate={false}
          textareaNoMaxLength
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

  const name = authorName || '';

  return (
    <div className="fiction-preview" style={{ backgroundColor: color }}>
      <div className="content-box">
        <ul className="actions">
          {editButton}
          {deleteButton}
        </ul>
        <Link className="link" to={link}>
          <div className="inner-box">
            <h3>
              {truncate(title, {
                length: FICTION_PREVIEW_TITLE_MAX_CHAR,
                separator: ' ',
                omission: '...'
              })}
            </h3>
            <p className="info">
              <span className="author">
                {truncate(name, {
                  length: FICTION_PREVIEW_NAME_MAX_CHAR,
                  separator: ' ',
                  omission: '...'
                })}{' '}
                -{' '}
              </span>
              <span className="published-date">{creationDate}</span>
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default FictionPreview;