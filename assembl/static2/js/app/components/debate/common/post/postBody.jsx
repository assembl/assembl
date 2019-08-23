// @flow
import * as React from 'react';
import { graphql } from 'react-apollo';
import activeHtml from 'react-active-html';
import classNames from 'classnames';
import jQuery from 'jquery';
import ARange from 'annotator_range'; // eslint-disable-line
import { withRouter } from 'react-router';
import { Translate } from 'react-redux-i18n';

import { EMPTY_STRING } from '../../../../constants';
import { getConnectedUserId } from '../../../../utils/globalFunctions';
import { isSpecialURL } from '../../../../utils/urlPreview';
import { transformLinksInHtml } from '../../../../utils/linkify';
import UpdateHarvestingTranslationPreference from '../../../../graphql/mutations/updateHarvestingTranslationPreference.graphql';
import PostTranslate from '../../common/translations/postTranslate';
import Embed from '../../../common/urlPreview/embed';
import URLMetadataLoader from '../../../common/urlPreview/urlMetadataLoader';
import { getExtractColor, getExtractTagId } from '../../../../utils/extract';
import ModalImage from '../modalImage';
import { defaultDisplayPolicy } from '../postsFilter/policies';

type State = {
  readMoreExpanded: boolean
};

type Props = {
  body: ?string,
  bodyDivRef?: Function, // eslint-disable-line react/require-default-props
  bodyMimeType: string,
  contentLocale: string,
  dbId: ?number,
  extracts: ?Array<?ExtractFragment>,
  handleMouseUpWhileHarvesting?: Function, // eslint-disable-line react/require-default-props
  id: string,
  isHarvestable?: boolean,
  isHarvesting: boolean,
  lang: string,
  measureTreeHeight?: Function, // eslint-disable-line react/require-default-props
  originalLocale: string,
  postsDisplayPolicy?: PostsDisplayPolicy,
  subject?: React.Node, // eslint-disable-line react/require-default-props
  translate: boolean,
  translationEnabled: boolean,
  updateHarvestingTranslation: Function
};

type ExtractInPostProps = {
  extractedByMachine: boolean,
  id: string,
  nature: string,
  state: string,
  children: React.Node
};

type PostBodyReplacementType = {
  afterload?: Function
};

type HtmlProps = {
  extracts?: ?Array<?ExtractFragment>,
  rawHtml: string,
  divRef?: ?Function,
  dbId?: ?number,
  replacementComponents: PostBodyReplacementType,
  contentLocale?: ?string
};

export const ExtractInPost = ({ extractedByMachine, id, nature, state, children }: ExtractInPostProps) => {
  const colorDefinition = getExtractColor(nature, state, extractedByMachine);
  return (
    <span
      className="extract-in-message"
      style={{
        backgroundColor: colorDefinition.background,
        color: colorDefinition.text
      }}
      id={id}
    >
      {children}
    </span>
  );
};

export const postBodyReplacementComponents = (afterLoad?: Function, isHarvesting?: boolean = false) => ({
  iframe: (attributes: Object) => (
    // the src iframe url is different from the resource url
    <Embed
      key={attributes.key}
      url={attributes['data-source-url'] || attributes.src}
      defaultEmbed={<iframe title="post-embed" {...attributes} />}
    />
  ),
  a: (attributes: Object) => {
    const { href, key, target, title, children } = attributes;
    const embeddedUrl = isSpecialURL(href);
    const origin = (
      <a key={`url-link-${key}`} href={href} className="linkified" target={target || '_blank'} title={title}>
        {children}
      </a>
    );
    const urlMetadataPreview =
      typeof children[0] === 'string' && children[0].startsWith('http') ? (
        <URLMetadataLoader key={`url-preview-${href}`} url={href} afterLoad={afterLoad} />
      ) : null;
    return (
      <React.Fragment>
        {embeddedUrl ? <Embed key={`url-embed-${href}`} url={href} /> : urlMetadataPreview}
        {origin}
      </React.Fragment>
    );
  },
  img: (attributes: Object) => {
    const { className, src, alt, title } = attributes;
    return <ModalImage className={className} src={src} alt={alt} title={title} />;
  },
  annotation: (attributes: Object) => {
    if (isHarvesting) {
      const { id, extractedByMachine, extractState, nature } = JSON.parse(attributes['data-extractinfo']);
      return (
        <ExtractInPost key={attributes.key} id={id} extractedByMachine={extractedByMachine} nature={nature} state={extractState}>
          {attributes.children}
        </ExtractInPost>
      );
    }

    return attributes.children;
  }
});

export const Html = (props: HtmlProps) => {
  const { extracts, rawHtml, divRef, dbId, replacementComponents, contentLocale, ...containerProps } = props;
  /*
   * The activeHtml() function will parse the raw html,
   * replace specified tags with provided components
   * and return a list of react elements
  */
  // this anchor is shared with marionette code
  const anchor = dbId ? getExtractTagId(dbId) : EMPTY_STRING;
  let html = `<div id="${anchor}">${rawHtml}</div>`;
  if (extracts && extracts.length > 0) {
    const white = /^\s*$/;
    const parser = new DOMParser();
    html = parser.parseFromString(html, 'text/html');
    if (html.body) {
      html = html.body;
    }
    extracts.forEach((extract) => {
      if (extract && extract.lang === contentLocale) {
        const tfis = extract.textFragmentIdentifiers;
        const extractInfo = JSON.stringify({
          id: extract.id,
          extractedByMachine: !!(extract.creator && extract.creator.isMachine),
          extractState: extract.extractState || EMPTY_STRING,
          nature: extract.extractNature || EMPTY_STRING
        });
        const wrapper = jQuery(`<annotation data-extractInfo='${extractInfo}'></annotation>`);
        if (tfis) {
          tfis.forEach((tfi) => {
            if (tfi && tfi.xpathStart && tfi.offsetStart !== null && tfi.xpathEnd && tfi.offsetEnd !== null) {
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
  // add a key to to fix a render issue with react 16 with duplicate texts after harvesting
  return (
    <div ref={divRef} {...containerProps} key={extracts ? extracts.length : 0}>
      {nodes}
    </div>
  );
};

Html.defaultProps = {
  extracts: [],
  contentLocale: null,
  divRef: null,
  dbId: null
};

Html.displayName = 'Html';

export class DumbPostBody extends React.Component<Props, State> {
  static defaultProps = {
    isHarvestable: false
  };

  state = { readMoreExpanded: false };

  expandReadMore = () => {
    this.setState({ readMoreExpanded: true });
  };

  collapseReadMore = () => {
    this.setState({ readMoreExpanded: false });
  };

  render() {
    const {
      bodyDivRef,
      body,
      bodyMimeType,
      contentLocale,
      dbId,
      extracts,
      handleMouseUpWhileHarvesting,
      id,
      isHarvestable,
      isHarvesting,
      lang,
      measureTreeHeight,
      originalLocale,
      postsDisplayPolicy,
      subject,
      translate,
      translationEnabled,
      updateHarvestingTranslation
    } = this.props;
    const { readMoreExpanded } = this.state;
    const divClassNames = 'post-body post-body--is-harvestable';
    const displayMode = (postsDisplayPolicy && postsDisplayPolicy.displayMode) || defaultDisplayPolicy.displayMode;
    const isSummaryDisplayMode = displayMode === 'summary' && !!body && body.length > 100;
    const htmlClassNames = classNames('post-body-content', isSummaryDisplayMode && !readMoreExpanded && 'truncate', 'body', {
      'pre-wrap': bodyMimeType === 'text/plain'
    });

    // Only non-special URLs (like Youtube or SketchFab) will be transformed
    // We need to add the URLs previews to the end of each post (See URLMetadataLoader)
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
            onTranslate={(from, into) => {
              const connectedUserIdBase64 = getConnectedUserId(true);
              if (connectedUserIdBase64 && isHarvesting && isHarvestable) {
                updateHarvestingTranslation({
                  variables: {
                    id: connectedUserIdBase64,
                    translation: {
                      localeFrom: from,
                      localeInto: into
                    }
                  }
                });
              }
            }}
          />
        ) : null}
        {subject && <h3 className="post-body-title dark-title-3">{subject}</h3>}
        {body && (
          <React.Fragment>
            <div className={htmlClassNames}>
              <Html
                onMouseUp={handleMouseUpWhileHarvesting}
                rawHtml={transformLinksInHtml(body)}
                divRef={bodyDivRef}
                extracts={extracts}
                dbId={dbId}
                replacementComponents={postBodyReplacementComponents(afterLoad, isHarvesting)}
                contentLocale={contentLocale}
              />
            </div>
            {isSummaryDisplayMode &&
              (readMoreExpanded ? (
                <div className="read-more" onClick={this.collapseReadMore}>
                  <Translate value="readLessEllipsis" />
                </div>
              ) : (
                <div className="read-more" onClick={this.expandReadMore}>
                  <Translate value="readMoreEllipsis" />
                </div>
              ))}
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default withRouter(
  graphql(UpdateHarvestingTranslationPreference, {
    name: 'updateHarvestingTranslation'
  })(DumbPostBody)
);