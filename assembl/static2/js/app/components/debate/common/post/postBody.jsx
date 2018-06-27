// @flow
import * as React from 'react';
import activeHtml from 'react-active-html';
import classNames from 'classnames';
import jQuery from 'jquery';
import ARange from 'annotator_range'; // eslint-disable-line

import PostTranslate from '../../common/translations/postTranslate';
import { transformLinksInHtml /* getUrls */ } from '../../../../utils/linkify';
import Embed from '../../../common/urlPreview/embed';
import URLMetadataLoader from '../../../common/urlPreview/urlMetadataLoader';
import { isSpecialURL } from '../../../../utils/urlPreview';
import { ExtractStates } from '../../../../constants';

type Props = {
  body: ?string,
  dbId: ?number,
  extracts: ?Array<?ExtractFragment>,
  bodyDivRef?: Function, // eslint-disable-line react/require-default-props
  bodyMimeType: string,
  contentLocale: string,
  id: string,
  lang: string,
  subject?: React.Node, // eslint-disable-line react/require-default-props
  originalLocale: string,
  translate: boolean,
  translationEnabled: boolean,
  handleMouseUpWhileHarvesting?: Function, // eslint-disable-line react/require-default-props
  measureTreeHeight?: Function // eslint-disable-line react/require-default-props
};

type ExtractInPostProps = {
  id: string,
  state: string,
  children: React.Node
};

const ExtractInPost = ({ id, state, children }: ExtractInPostProps) => {
  const isSubmitted = state === ExtractStates.SUBMITTED;
  return (
    <span
      className={classNames('extract-in-message', {
        submitted: isSubmitted
      })}
      id={id}
    >
      {children}
    </span>
  );
};

const postBodyReplacementComponents = afterLoad => ({
  iframe: attributes => (
    // the src iframe url is different from the resource url
    <Embed url={attributes['data-source-url'] || attributes.src} defaultEmbed={<iframe title="post-embed" {...attributes} />} />
  ),
  a: (attributes) => {
    const embeddedUrl = isSpecialURL(attributes.href);
    const origin = (
      <a key={`url-link-${attributes.href}`} href={attributes.href} className="linkified" target="_blank">
        {attributes.href}
      </a>
    );
    if (embeddedUrl) return origin;
    return [origin, <URLMetadataLoader key={`url-preview-${attributes.href}`} url={attributes.href} afterLoad={afterLoad} />];
  },
  annotation: attributes => (
    <ExtractInPost id={attributes.id} state={attributes['data-state']}>
      {attributes.children}
    </ExtractInPost>
  )
});

const Html = (props) => {
  const { extracts, rawHtml, divRef, dbId, replacementComponents } = props;
  /*
   * The activeHtml() function will parse the raw html,
   * replace specified tags with provided components
   * and return a list of react elements
  */
  // this anchor is shared with marionette code
  const anchor = dbId ? `message-body-local:Content/${dbId}` : '';
  let html = `<div id="${anchor}">${rawHtml}</div>`;

  if (extracts) {
    const white = /^\s*$/;
    const parser = new DOMParser();
    html = parser.parseFromString(html, 'text/html');
    if (html.body) {
      html = html.body;
    }
    extracts.forEach((extract) => {
      if (extract) {
        const tfis = extract.textFragmentIdentifiers;
        const wrapper = jQuery(`<annotation id="${extract.id}" data-state="${extract.extractState || ''}"></annotation>`);
        if (tfis) {
          tfis.forEach((tfi) => {
            if (tfi && tfi.xpathStart && tfi.offsetStart && tfi.xpathEnd && tfi.offsetEnd) {
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
            }
          });
        }
      }
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
  handleMouseUpWhileHarvesting,
  measureTreeHeight
}: Props) => {
  const divClassNames = classNames('post-body', { 'post-body--is-harvestable': !translate });
  const htmlClassNames = classNames('post-body-content', 'body', {
    'pre-wrap': bodyMimeType === 'text/plain'
  });
  // Only non-special URLs (like Youtube or SketchFab) will be transformed
  // We need to add the URLs previews to the end of each post (See URLMetadataLoader)
  // const urls = body && [...getUrls(body.replace(/<\/p>/gi, ' </p>'))].filter(url => !isSpecialURL(url));
  const afterLoad = () => {
    if (measureTreeHeight) measureTreeHeight(400);
  };
  return (
    <div className={divClassNames}>
      {translationEnabled ? (
        <PostTranslate
          contentLocale={contentLocale}
          id={id}
          lang={lang}
          originalLocale={originalLocale}
          translate={translate}
          afterLoad={afterLoad}
        />
      ) : null}
      {subject && <h3 className="post-body-title dark-title-3">{subject}</h3>}
      {body && (
        <div className={htmlClassNames}>
          <Html
            onMouseUp={handleMouseUpWhileHarvesting}
            rawHtml={transformLinksInHtml(body)}
            divRef={bodyDivRef}
            extracts={extracts}
            dbId={dbId}
            replacementComponents={postBodyReplacementComponents(afterLoad)}
          />
          {/* {urls && (
            <div className="urls-container">
              {urls.map(url => <URLMetadataLoader key={url} url={url} afterLoad={afterLoad} />)}
            </div>
          )} */}
        </div>
      )}
    </div>
  );
};

export default PostBody;