// @flow
import React, { Fragment } from 'react';

export type FictionBodyProps = {
  title: string,
  content: string
};

const noTitleMessage: string = 'no title specified';
const noContentMessage: string = 'no content specified';

const FictionBody = ({ title, content }: FictionBodyProps) => (
  <Fragment>
    <h1 className="fiction-title">{title || noTitleMessage}</h1>
    <div className="fiction-content" dangerouslySetInnerHTML={{ __html: content || noContentMessage }} />
  </Fragment>
);

export default FictionBody;