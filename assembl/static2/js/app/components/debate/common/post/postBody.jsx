// @noflow
import * as React from 'react';
import activeHtml from 'react-active-html';
import classNames from 'classnames';
import jQuery from 'jquery';
import ARange from 'annotator_range'; // eslint-disable-line

import PostTranslate from '../../common/translations/postTranslate';
import { transformLinksInHtml } from '../../../../utils/linkify';
import { youtubeRegexp } from '../../../../utils/globalFunctions';
import YoutubeTheater from '../../../common/youtubeTheater';

type Props = {
  body: string,
  dbId: number,
  extracts: Array<Extract>,
  bodyDivRef: ?Function,
  bodyMimeType: string,
  contentLocale: string,
  id: string,
  lang: string,
  subject: ?React.Element<any>,
  originalLocale: string,
  translate: boolean,
  translationEnabled: boolean,
  isHarvesting: boolean,
  handleMouseUpWhileHarvesting: ?Function
};

type ExtractInPostProps = {
  id: string,
  children: React.Children
};

const ExtractInPost = ({ id, children }: ExtractInPostProps) => (
  <span className="extract-in-message" id={id}>
    {children}
  </span>
);

const postBodyReplacementComponents = {
  iframe: (attributes) => {
    const { src } = attributes;
    const regexpMatch = src.match(youtubeRegexp);
    if (regexpMatch) {
      const videoId = regexpMatch[1];
      return <YoutubeTheater videoId={videoId} />;
    }
    return <iframe title="post-embed" {...attributes} />;
  },
  annotation: attributes => <ExtractInPost id={attributes.id}>{attributes.children}</ExtractInPost>
};

const Html = (props) => {
  const { extracts, rawHtml, divRef, dbId, replacementComponents } = props;
  /*
   * The activeHtml() function will parse the raw html,
   * replace specified tags with provided components
   * and return a list of react elements
  */
  // this anchor is shared with marionette code
  const anchor = `message-body-local:Content/${dbId}`;
  let html = `<div id="${anchor}">${rawHtml}</div>`;

  if (extracts) {
    const white = /^\s*$/;
    const parser = new DOMParser();
    html = parser.parseFromString(html, 'text/html');
    if (html.body) {
      html = html.body;
    }
    extracts.forEach((extract) => {
      const wrapper = jQuery(`<annotation id="${extract.id}"></annotation>`);
      extract.textFragmentIdentifiers.forEach((tfi) => {
        const range = new ARange.SerializedRange({
          start: tfi.xpathStart,
          startOffset: tfi.offsetStart,
          end: tfi.xpathEnd,
          endOffset: tfi.offsetEnd
        });
        try {
          const normedRange = range.normalize(html);
          const nodes = jQuery(normedRange.textNodes()).filter((idx, node) => !white.test(node));
          nodes.wrap(wrapper);
        } catch (error) {
          console.error(error); // eslint-disable-line no-console
        }
      });
    });
    html = html.children;
  }
  const nodes = activeHtml(html, replacementComponents);
  const containerProps = { ...props };
  delete containerProps.rawHtml;
  delete containerProps.divRef;
  delete containerProps.replacementComponents;
  delete containerProps.extracts;
  delete containerProps.dbId;
  // add a key to to fix a render issue with react 16 with duplicate texts after harvesting
  return (
    <div ref={divRef} {...containerProps} key={extracts ? extracts.length : 0}>
      {nodes}
    </div>
  );
};

const PostBody = ({
  body,
  extracts,
  bodyDivRef,
  bodyMimeType,
  contentLocale,
  id,
  dbId,
  lang,
  subject,
  originalLocale,
  translate,
  translationEnabled,
  isHarvesting,
  handleMouseUpWhileHarvesting
}: Props) => {
  const divClassNames = classNames('post-body', { 'post-body--is-harvestable': !translate });
  const htmlClassNames = classNames('post-body-content', 'body', {
    'pre-wrap': bodyMimeType === 'text/plain',
    'is-harvesting': isHarvesting
  });
  return (
    <div className={divClassNames}>
      {translationEnabled ? (
        <PostTranslate contentLocale={contentLocale} id={id} lang={lang} originalLocale={originalLocale} translate={translate} />
      ) : null}
      {subject && <h3 className="post-body-title dark-title-3">{subject}</h3>}
      {body && (
        <Html
          onMouseUp={handleMouseUpWhileHarvesting}
          rawHtml={transformLinksInHtml(body)}
          className={htmlClassNames}
          divRef={bodyDivRef}
          extracts={extracts}
          dbId={dbId}
          replacementComponents={postBodyReplacementComponents}
        />
      )}
    </div>
  );
};

export default PostBody;