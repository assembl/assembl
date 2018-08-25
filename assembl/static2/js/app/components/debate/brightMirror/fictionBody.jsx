// @flow
import React, { Fragment } from 'react';

type FictionBodyType = {
  /** Optional fiction title */
  title?: string,
  /** Optional fiction content */
  content?: string
};

const fictionBody = ({ title, content }: FictionBodyType) => (
  <Fragment>
    <h1 className="fiction-title">{title}</h1>
    <div className="fiction-content">{content}</div>
  </Fragment>
);

fictionBody.defaultProps = {
  title: 'no title specified',
  content: 'no content specified'
};

export default fictionBody;