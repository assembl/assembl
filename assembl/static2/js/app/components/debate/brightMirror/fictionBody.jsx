// @flow
import React, { Fragment } from 'react';
import PostBody from '../common/post/postBody';

export type FictionBodyProps = {
  id: string,
  title: string,
  content: string,
  contentLocale: string,
  lang: string
};

const noTitleMessage: string = 'no title specified';
const noContentMessage: string = 'no content specified';

const FictionBody = ({ id, title, content, contentLocale, lang }: FictionBodyProps) => (
  <Fragment>
    <h1 className="fiction-title">{title || noTitleMessage}</h1>
    <div className="fiction-content">
      <PostBody
        body={content || noContentMessage}
        contentLocale={contentLocale}
        id={id}
        lang={lang}
        originalLocale={contentLocale}
        translate={false}
        translationEnabled={false}
        isHarvesting={false}
      />
    </div>
  </Fragment>
);

export default FictionBody;