// @flow
import * as React from 'react';
import { Link } from 'react-router';
import { I18n } from 'react-redux-i18n';
import classNames from 'classnames';
// Constant imports
import { PublicationStates } from '../../../constants';
// Components imports
import EditPostForm from '../common/editPostForm';
import EditPostButton from '../common/editPostButton';
import DeletePostButton from '../common/deletePostButton';
import SharePostButton from '../common/sharePostButton';
import ResponsiveOverlayTrigger from '../../common/responsiveOverlayTrigger';
import { editFictionTooltip, deleteFictionTooltip, shareFictionTooltip } from '../../common/tooltips';
// Utils imports
import { displayCustomModal, closeModal } from '../../../utils/utilityManager';
import { getPictureUrl } from '../../../utils/globalFunctions';
// Type imports
import type { BrightMirrorFictionProps } from '../../../pages/brightMirrorFiction';
import type { Props as SharePostButtonProps } from '../common/sharePostButton';

export type FictionPreviewProps = {
  id: string,
  title: ?string,
  authorName: ?string,
  creationDate: string,
  link: string,
  originalBody: string,
  /** Function to refresh idea */
  refetchIdea: Function,
  lang: string,
  userCanEdit: boolean,
  userCanDelete: boolean,
  deleteFictionHandler: Function,
  publicationState: string,
  /** Fiction meta information: slug, phase, themeId, fictionId */
  fictionMetaInfo: BrightMirrorFictionProps,
  /** Picture id needed to return the link of the picture to display with getPictureUrl */
  pictureId: number
};

const FictionPreview = ({
  id,
  title,
  authorName,
  creationDate,
  link,
  originalBody,
  refetchIdea,
  lang,
  userCanEdit,
  userCanDelete,
  deleteFictionHandler,
  publicationState,
  fictionMetaInfo,
  pictureId
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

  const sharePostButtonProps: SharePostButtonProps = {
    linkClassName: 'share',
    routerParams: { ...fictionMetaInfo },
    modalTitleMsgKey: 'debate.brightMirror.shareFiction',
    type: 'brightMirrorFiction'
  };

  const shareButton = isDraft ? null : (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={shareFictionTooltip}>
        <SharePostButton {...sharePostButtonProps} />
      </ResponsiveOverlayTrigger>
    </li>
  );

  // Format author name
  const name = authorName || '';
  const date = ` - ${creationDate}`;

  // Display preview picture only when the post is not a draft
  // We add a black overlay with an opacity of 0.2 to fix contrast issue when displaying a light label
  const previewStyle = isDraft
    ? null
    : { backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(${getPictureUrl(pictureId)})` };

  return (
    <div className={classNames('fiction-preview', { draft: isDraft })} style={previewStyle}>
      <div className="content-box">
        <ul className="actions">
          {editButton}
          {deleteButton}
          {shareButton}
        </ul>
        <Link className="link" to={link}>
          {isDraft ? <div className="draft-label">{I18n.t('debate.brightMirror.draftLabel')}</div> : null}
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