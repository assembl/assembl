// @flow
import * as React from 'react';
import { Link } from 'react-router';
import { I18n, Localize, Translate } from 'react-redux-i18n';
import ResponsiveOverlayTrigger from '../common/responsiveOverlayTrigger';
import EditPostButton from '../debate/common/editPostButton';
import { deleteSynthesisTooltip, editSynthesisTooltip } from '../common/tooltips';
import type { SynthesisItem } from './types.flow';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { get as getLink } from '../../utils/routeMap';
import { browserHistory } from '../../router';
import DeleteSynthesisButton from '../administration/synthesis/deleteSynthesisButton';
import { displayAlert } from '../../utils/utilityManager';
import { PublicationStates } from '../../constants';

export type Props = {
  synthesis: SynthesisItem,
  // userCanEdit: boolean,
  // userCanDelete: boolean,
  refetchQueries: Array<any>
};

const handleEdit = (synthesis: SynthesisItem) => {
  const slug = getDiscussionSlug();
  browserHistory.push(getLink('editSynthesis', { slug: slug, synthesisId: synthesis.post.id }));
  // redirect to the storychief edition interface
};

const SynthesisPreview = ({ synthesis, refetchQueries }: Props) => {
  const isDraft = synthesis.post.publicationState === PublicationStates.DRAFT;
  const editButton = (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={editSynthesisTooltip}>
        <EditPostButton handleClick={() => handleEdit(synthesis)} linkClassName="edit" />
      </ResponsiveOverlayTrigger>
    </li>
  );

  // Define callback functions
  const deleteCallback = () => {
    displayAlert('success', I18n.t('debate.syntheses.deleteSuccessMessage'));
  };

  const deleteButton = (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={deleteSynthesisTooltip}>
        <DeleteSynthesisButton
          synthesisPostId={synthesis.post.id}
          modalBodyMessage="debate.syntheses.confirmDeletionBody"
          refetchQueries={refetchQueries}
          onDeleteCallback={deleteCallback}
        />
      </ResponsiveOverlayTrigger>
    </li>
  );

  const slug = getDiscussionSlug();
  const link = getLink('synthesis', { synthesisId: synthesis.post.id, slug: slug });

  const previewStyle =
    synthesis.img && synthesis.img.externalUrl
      ? { backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), url(${synthesis.img.externalUrl})` }
      : null;
  return (
    <div className="fiction-preview" style={previewStyle}>
      <div className="content-box">
        <ul className="actions">
          {editButton}
          {deleteButton}
        </ul>
        <Link className="link" to={link}>
          {isDraft ? <div className="draft-label">{I18n.t('debate.brightMirror.draftLabel')}</div> : null}
          <div className="inner-box">
            <h3>{synthesis.subject}</h3>
            <p className="info">
              <span className="published-date">
                <Translate value="debate.syntheses.publishedOn" />
                <Localize value={synthesis.creationDate} dateFormat="date.format" />
              </span>
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SynthesisPreview;