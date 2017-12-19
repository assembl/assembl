// @flow
import React from 'react';
import get from 'lodash/get';
import activeHtml from 'react-active-html';
import YouTube from 'react-youtube';

import PostTranslate from '../../common/translations/postTranslate';
import { transformLinksInHtml } from '../../../../utils/linkify';
import { youtubeRegexp } from '../../../../utils/globalFunctions';

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

class YouTubeWithTheater extends React.Component {
  state: {
    theaterMode?: boolean
  };

  timeout: number;

  closeTheater = () => this.setState({ theaterMode: false });

  openTheater = () => this.setState({ theaterMode: true });

  render = () => {
    const { videoId } = this.props;
    const theaterMode = get(this, 'state.theaterMode', false);
    const video = (
      <YouTube
        className="youtube-video"
        videoId={videoId}
        id={`youtube-${videoId}`} // might create problems if there is two times the same videoId
        onPlay={() => {
          clearTimeout(this.timeout);
          this.openTheater();
        }}
        onPause={() => {
          const skipTimeout = 200; // The timeout is there because skipping through the video fires an onPause followed by an onPlay
          this.timeout = setTimeout(this.closeTheater, skipTimeout);
        }}
      />
    );
    return (
      <div className={`youtube-theater ${theaterMode ? 'open' : ''}`}>
        <div className="theater-content">
          {video}
          {theaterMode && <button onClick={this.closeTheater} className="close-theater-button assembl-icon-cancel" />}
        </div>
      </div>
    );
  };
}

const postBodyReplacementComponents = {
  iframe: (attributes) => {
    const { src } = attributes;
    const regexpMatch = src.match(youtubeRegexp);
    if (regexpMatch) {
      const videoId = regexpMatch[1];
      return <YouTubeWithTheater videoId={videoId} />;
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
}: Props) => (
  <div className="post-body">
    {translationEnabled ? (
      <PostTranslate contentLocale={contentLocale} id={id} lang={lang} originalLocale={originalLocale} translate={translate} />
    ) : null}
    {subject && <h3 className="dark-title-3">{subject}</h3>}
    {body && (
      <Html
        rawHtml={transformLinksInHtml(body)}
        className={`body ${bodyMimeType === 'text/plain' ? 'pre-wrap' : ''}`}
        divRef={bodyDivRef}
        replacementComponents={postBodyReplacementComponents}
      />
    )}
  </div>
);

export default PostBody;