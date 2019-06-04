// @flow
import * as React from 'react';
import { Link } from 'react-router';
import { I18n, Localize, Translate } from 'react-redux-i18n';
import type { SynthesisItem } from './types.flow';
import { getDiscussionSlug } from '../../utils/globalFunctions';
import { get as getLink } from '../../utils/routeMap';
import { PublicationStates } from '../../constants';
import { deleteButton, editButton } from './actions';

export type Props = {
  synthesis: SynthesisItem,
  refetchQueries: Array<any>
};

const SynthesisPreview = ({ synthesis, refetchQueries }: Props) => {
  const isDraft = synthesis.post.publicationState === PublicationStates.DRAFT;

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
          {editButton(synthesis.post.id)}
          {deleteButton(synthesis.post.id, refetchQueries)}
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