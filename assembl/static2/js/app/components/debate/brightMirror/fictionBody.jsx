// @flow
import React, { Fragment } from 'react';

type Props = {
  /** Optional fiction title */
  title?: string,
  /** Optional fiction content */
  content?: string
};

const FictionBody = ({ title, content }: Props) => (
  <Fragment>
    <h1 className="fiction-title">{title}</h1>
    <div className="fiction-content">{content}</div>
  </Fragment>
);

FictionBody.defaultProps = {
  title: 'no title specified',
  content: 'no content specified'
};

export default FictionBody;