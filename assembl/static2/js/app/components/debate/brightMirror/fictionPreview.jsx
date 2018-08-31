// @flow
import * as React from 'react';
import { Link } from 'react-router';
import truncate from 'lodash/truncate';

const TITLE_MAX_CHAR = 60;
const NAME_MAX_CHAR = 20;

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
            length: TITLE_MAX_CHAR,
            separator: ' ',
            omission: '...'
          })}
        </h3>
        <p className="info">
          <span className="author">
            {truncate(authorName, {
              length: NAME_MAX_CHAR,
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
);

export default FictionPreview;