// @flow
import * as React from 'react';
import { Link } from 'react-router';
import { Translate, Localize } from 'react-redux-i18n';
// import classnames from 'classnames';
// import DeletePostButton from '../debate/common/deletePostButton';

export type Props = {
  subject: ?string,
  creationDate: string,
  link: string,
  lang: string,
  userCanEdit: boolean,
  userCanDelete: boolean,
  img: ?string
};

const SynthesisPreview = ({ img, subject, creationDate, link }: Props) => (
  <div className="fiction-preview" style={img ? { backgroundImage: `url(${img})` } : null}>
    <div className="content-box">
      <ul className="actions">{/* {editButton}
        {deleteButton}
        {shareButton} */}</ul>
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

export default SynthesisPreview;