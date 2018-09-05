// @flow
import * as React from 'react';
import { Link } from 'react-router';
import truncate from 'lodash/truncate';

import { FICTION_PREVIEW_TITLE_MAX_CHAR, FICTION_PREVIEW_NAME_MAX_CHAR } from '../../../constants';
import EditPostForm from '../common/editPostForm';
import { displayCustomModal, closeModal } from '../../../utils/utilityManager';
import EditPostButton from '../common/editPostButton';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { editFictionTooltip } from '../../common/tooltips';

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
  userCanEdit: boolean
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
  userCanEdit
}: FictionPreviewProps) => {
  const openPostModal = () => {
    const content = (
      <div className="fiction-edit-modal">
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
        />
      </div>
    );
    return displayCustomModal(content, true);
  };

  const editButton = (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={editFictionTooltip}>
        <EditPostButton handleClick={openPostModal} linkClassName="edit" />
      </ResponsiveOverlayTrigger>
    </li>
  );

  const name = authorName || '';

  return (
    <div className="fiction-preview" style={{ backgroundColor: color }}>
      <div className="content-box">
        <ul className="actions hidden-xs">{userCanEdit ? editButton : null}</ul>
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