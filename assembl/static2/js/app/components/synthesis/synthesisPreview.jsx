// @flow
import * as React from 'react';
import { Link } from 'react-router';
import { Translate, Localize } from 'react-redux-i18n';
import ResponsiveOverlayTrigger from '../common/responsiveOverlayTrigger';
import EditPostButton from '../debate/common/editPostButton';
import DeletePostIcon from '../common/icons/deletePostIcon/deletePostIcon';
import { deleteSynthesisTooltip, editSynthesisTooltip } from '../common/tooltips';
// import classnames from 'classnames';
// import DeletePostButton from '../debate/common/deletePostButton';

export type Props = {
  subject: ?string,
  creationDate: string,
  link: string,
  userCanEdit: boolean,
  userCanDelete: boolean,
  img: ?string
};

const SynthesisPreview = ({ img, subject, creationDate, link }: Props) => {
  const handleEdit = () => {
    // redirect to the storychief edition interface
  };
  const editButton = (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={editSynthesisTooltip}>
        <EditPostButton handleClick={handleEdit} linkClassName="edit" />
      </ResponsiveOverlayTrigger>
    </li>
  );
  const handleDelete = () => {
    // do stuff
  };
  const deleteButton = (
    <li>
      <ResponsiveOverlayTrigger placement="left" tooltip={deleteSynthesisTooltip}>
        <DeletePostIcon />
      </ResponsiveOverlayTrigger>
    </li>
  );
  return (
    <div className="fiction-preview" style={img ? { backgroundImage: `url(${img})` } : null}>
      <div className="content-box">
        <ul className="actions">
          {editButton}
          {deleteButton}
        </ul>
        <Link className="link" to={link}>
          {/* {isDraft ? <div className="draft-label">{I18n.t('debate.brightMirror.draftLabel')}</div> : null} */}
          <div className="inner-box">
            <h3>{subject}</h3>
            <p className="info">
              <span className="published-date">
                <Translate value="debate.syntheses.publishedOn" />
                <Localize value={creationDate} dateFormat="date.format" />
              </span>
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default SynthesisPreview;