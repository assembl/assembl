// @flow
import * as React from 'react';
import { Link } from 'react-router';
import truncate from 'lodash/truncate';

const TITLE_MAX_CHAR = 60;
const NAME_MAX_CHAR = 20;

export type FictionPreviewType = {
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

const FictionPreview = (props: FictionPreviewType) => (
  <div className="fiction-preview" style={{ backgroundColor: props.color }}>
    <Link className="content-box" to={props.link}>
      <div className="inner-box">
        <h3 className="light-title-3 center">
          {truncate(props.title, {
            length: TITLE_MAX_CHAR,
            separator: ' ',
            omission: '...'
          })}
        </h3>
        <p className="info">
          <span className="author">
            {truncate(props.authorName, {
              length: NAME_MAX_CHAR,
              separator: ' ',
              omission: '...'
            })}{' '}
            -{' '}
          </span>
          <span className="published-date">{props.creationDate}</span>
        </p>
      </div>
    </Link>
  </div>
);

FictionPreview.defaultProps = {
  new: false
};

export default FictionPreview;