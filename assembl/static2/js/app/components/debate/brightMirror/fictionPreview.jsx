// @flow
import * as React from 'react';
import { Link } from 'react-router';
import truncate from 'lodash/truncate';

import { FICTION_PREVIEW_TITLE_MAX_CHAR, FICTION_PREVIEW_NAME_MAX_CHAR } from '../../../constants';

export type FictionPreviewProps = {
  /** Fiction title */
  title: string,
  /** Author fullname */
  authorName: string,
  /** Creation date */
  creationDate: string,
  /** Url to fiction */
  link: string,
  /** Background color */
  color: string
};

const FictionPreview = ({ title, authorName, creationDate, link, color }: FictionPreviewProps) => (
  <div className="fiction-preview" style={{ backgroundColor: color }}>
    <Link className="content-box" to={link}>
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
            {truncate(authorName, {
              length: FICTION_PREVIEW_NAME_MAX_CHAR,
              separator: ' ',
              omission: '...'
            })}
          </span>
          <span className="published-date">{creationDate}</span>
        </p>
      </div>
    </Link>
  </div>
);

export default FictionPreview;