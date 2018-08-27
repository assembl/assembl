// @flow
import React, { Fragment } from 'react';

export type FictionBodyType = {
  /** Fiction title */
  title: string,
  /** Fiction content */
  content: string
};

const noTitleMessage: string = 'no title specified';
const noContentMessage: string = 'no content specified';

const fictionBody = ({ title, content }: FictionBodyType) => (
  <Fragment>
    <h1 className="fiction-title">{title || noTitleMessage}</h1>
    <div className="fiction-content" dangerouslySetInnerHTML={{ __html: content || noContentMessage }} />
  </Fragment>
);

export default fictionBody;