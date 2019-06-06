// @flow
import linkifyHtml from 'linkifyjs/html';
import activeHtml from 'react-active-html';
import { postBodyReplacementComponents } from '../components/debate/common/post/postBody';

function addIframeForStoryChief(html: string): string {
  const url = /(<a href="(https:\/\/(.*\.storychief\.io)[^\s]+)".*?<\/a>)/gi;
  return html.replace(url, '<iframe class="synthesis-iframe" src="$2"></iframe>');
}

export function transformLinksInHtml(html: string): string {
  let content = linkifyHtml(html);
  content = addIframeForStoryChief(content);
  return content;
}

export function addProtocol(url: string): string {
  const hasProtocol = /^(http|ftp)s?:\/\//.test(url);
  return hasProtocol ? url : `https://${url}`;
}

export function addIframeForMindMapping(html: string): string {
  const url = /(<a href="(https:\/\/(share.mindmanager.com|embed.coggle.it)[^\s]+)".*?<\/a>)/gi;
  return html.replace(url, '<div class="iframed"><iframe src="$2"></iframe></div>');
}

export const renderRichtext = (text: string) => activeHtml(text && transformLinksInHtml(text), postBodyReplacementComponents());