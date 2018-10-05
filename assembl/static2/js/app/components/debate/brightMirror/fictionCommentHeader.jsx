// @flow
import React from 'react';
import { Translate } from 'react-redux-i18n';
import { Image } from 'react-bootstrap';

export type FictionCommentHeaderProps = {
  /** Comment header strong title */
  strongTitle: string,
  /** Comment header title */
  title: string,
  /** Comment header image source */
  imgSrc: string,
  /** Comment header image description */
  imgAlt: string,
  /** Number of comments */
  commentsCount: number
};

const FictionCommentHeader = ({ strongTitle, title, imgSrc, imgAlt, commentsCount }: FictionCommentHeaderProps) => (
  <div className="comments-header">
    <h1 className="title">
      <span className="highlight">{strongTitle}&nbsp;</span>
      {title}
    </h1>
    <p>
      <Image responsive src={imgSrc} alt={imgAlt} />
    </p>
    <p className="subtitle center">
      <Translate value="debate.brightMirror.commentFiction.numberOfComments" count={commentsCount} />
    </p>
  </div>
);

export default FictionCommentHeader;