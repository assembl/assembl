// @flow
import React from 'react';

import PostTranslate from '../../common/translations/postTranslate';
import { transformLinksInHtml } from '../../../../utils/linkify';

type Props = {
  body: string,
  bodyDivRef: ?Function,
  bodyMimeType: string,
  contentLocale: string,
  id: string,
  lang: string,
  subject: ?React.Element<*>,
  originalLocale: string,
  translate: boolean,
  translationEnabled: boolean
};

const PostBody = ({
  body,
  bodyDivRef,
  bodyMimeType,
  contentLocale,
  id,
  lang,
  subject,
  originalLocale,
  translate,
  translationEnabled
}: Props) => (
  <div className="post-body">
    {translationEnabled ? (
      <PostTranslate contentLocale={contentLocale} id={id} lang={lang} originalLocale={originalLocale} translate={translate} />
    ) : null}
    {subject && <h3 className="dark-title-3">{subject}</h3>}
    <div
      className={`body ${bodyMimeType === 'text/plain' ? 'pre-wrap' : ''}`}
      dangerouslySetInnerHTML={{ __html: transformLinksInHtml(body) }}
      ref={bodyDivRef}
    />
  </div>
);

export default PostBody;