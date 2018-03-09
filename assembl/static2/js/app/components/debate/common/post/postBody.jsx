// @flow
import React from 'react';
import activeHtml from 'react-active-html';
import classNames from 'classnames';

import PostTranslate from '../../common/translations/postTranslate';
import { transformLinksInHtml } from '../../../../utils/linkify';
import { youtubeRegexp } from '../../../../utils/globalFunctions';
import YoutubeTheater from '../../../common/youtubeTheater';

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

const postBodyReplacementComponents = {
  iframe: (attributes) => {
    const { src } = attributes;
    const regexpMatch = src.match(youtubeRegexp);
    if (regexpMatch) {
      const videoId = regexpMatch[1];
      return <YoutubeTheater videoId={videoId} />;
    }
    return <iframe title="post-embed" {...attributes} />;
  }
};

const Html = (props) => {
  const { rawHtml, divRef, replacementComponents } = props;
  /*
   * The activeHtml() function will parse the raw html,
   * replace specified tags with provided components
   * and return a list of react elements
  */
  const nodes = activeHtml(rawHtml, replacementComponents);
  const containerProps = { ...props };
  delete containerProps.rawHtml;
  delete containerProps.divRef;
  delete containerProps.replacementComponents;
  return (
    <div ref={divRef} {...containerProps}>
      {nodes}
    </div>
  );
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
}: Props) => {
  const divClassNames = classNames('post-body', { 'post-body--is-harvestable': !translate });
  const htmlClassNames = classNames('post-body-content', 'body', { 'pre-wrap': bodyMimeType === 'text/plain' });
  return (
    <div className={divClassNames}>
      {translationEnabled ? (
        <PostTranslate contentLocale={contentLocale} id={id} lang={lang} originalLocale={originalLocale} translate={translate} />
      ) : null}
      {subject && <h3 className="post-body-title dark-title-3">{subject}</h3>}
      {body && (
        <Html
          rawHtml={transformLinksInHtml(body)}
          className={htmlClassNames}
          divRef={bodyDivRef}
          replacementComponents={postBodyReplacementComponents}
        />
      )}
    </div>
  );
};

export default PostBody;