// @flow
import React from 'react';
import activeHtml from 'react-active-html';
import classNames from 'classnames';
import jQuery from 'jquery';

import PostTranslate from '../../common/translations/postTranslate';
import { transformLinksInHtml } from '../../../../utils/linkify';
import { youtubeRegexp } from '../../../../utils/globalFunctions';
import YoutubeTheater from '../../../common/youtubeTheater';

// Annotator needs this global.
global.jQuery = jQuery;
// Use require, which will run in code sequence, rather than import,
// which runs before any code, incl. the global declaration above.
const Annotator = require('annotator'); // eslint-disable-line

export type TextFragmentIdentifier = {
  xpathStart: string,
  xpathEnd: string,
  offsetStart: number,
  offsetEnd: number
};

export type Extract = {
  textFragmentIdentifiers: Array<TextFragmentIdentifier>,
  id: string,
  important: boolean,
  body: string
};

type Props = {
  body: string,
  dbId: number,
  extracts: Array<Extract>,
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

type ExtractInPostProps = {
  id: string,
  children: React.Children
};

const ExtractInPost = ({ id, children }: ExtractInPostProps) => {
  const style = {
    // TODO: set in harvesting.scss when taxonomy part 0 branch is merged
    display: 'inline',
    backgroundColor: 'yellow'
  };
  return (
    <div className="extract-in-message" id={id} style={style}>
      {children}
    </div>
  );
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
        const range = new Annotator.Annotator.Range.SerializedRange({
          start: tfi.xpathStart,
          startOffset: tfi.offsetStart,
          end: tfi.xpathEnd,
          endOffset: tfi.offsetEnd
        });
        const normedRange = range.normalize(html);
        const nodes = jQuery(normedRange.textNodes()).filter((idx, node) => !white.test(node));
        nodes.wrap(wrapper);
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
  return (
    <div ref={divRef} {...containerProps}>
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
          extracts={extracts}
          dbId={dbId}
          replacementComponents={postBodyReplacementComponents}
        />
      )}
    </div>
  );
};

export default PostBody;