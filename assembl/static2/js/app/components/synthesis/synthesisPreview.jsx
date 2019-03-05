// @flow
import * as React from 'react';
import { Link } from 'react-router';
// import { I18n } from 'react-redux-i18n';
// import classnames from 'classnames';
// import DeletePostButton from '../debate/common/deletePostButton';

export type Props = {
  id: string,
  title: ?string,
  subTitle: ?string,
  creationDate: string,
  link: string,
  lang: string,
  userCanEdit: boolean,
  userCanDelete: boolean,
  imageUrl: ?string
};

const SynthesisPreview = ({ imageUrl, title, subTitle, id, creationDate, link }: Props) => (
  <div className="fiction-preview" style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : null}>
    <div className="content-box">
      <ul className="actions">{/* {editButton}
        {deleteButton}
        {shareButton} */}</ul>
      <Link className="link" to={link}>
        {/* {isDraft ? <div className="draft-label">{I18n.t('debate.brightMirror.draftLabel')}</div> : null} */}
        <div className="inner-box">
          <h3>{title}</h3>
          <h5>{subTitle}</h5>
          <p className="info">
            <span className="published-date">{creationDate}</span>
          </p>
        </div>
      </Link>
    </div>
  </div>
);

export default SynthesisPreview;