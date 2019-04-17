// @flow
import linkifyHtml from 'linkifyjs/html';
import * as linkify from 'linkifyjs';
import activeHtml from 'react-active-html';
import { postBodyReplacementComponents } from '../components/debate/common/post/postBody';

type LinkifyLink = {
  href: string,
  type: string,
  value: string
};

export function getUrls(html: string): Array<string> {
  // first, we add spaces before </p> to help linkify
  const htmlForLinkify = html.replace(/<\/p>/gi, ' </p>');
  return linkify.find(htmlForLinkify).map((link: LinkifyLink) => link.href);
}

export function transformLinksInHtml(html: string): string {
  return linkifyHtml(html);
}

export function addProtocol(url: string): string {
  const hasProtocol = /^(http|ftp)s?:\/\//.test(url);
  return hasProtocol ? url : `https://${url}`;
}

export function addIframeForMindMapping(html: string): string {
  // add new url to this array if you want to embed another mindmap iframe
  const urlArray = ['share.mindmanager.com', 'embed.coggle.it'];
  const filteredUrlArray = urlArray.filter(websiteUrl => html.includes(websiteUrl));
  const url = filteredUrlArray.length ? filteredUrlArray[0] : '';
  const regex = new RegExp(`(<a href="(https://${url}[^\\s]+)".*</a>)`, 'gi');
  return html.replace(regex, '<div class="iframed"><iframe src="$2"></iframe></div>');
}

export const renderRichtext = (text: string) => activeHtml(text && transformLinksInHtml(text), postBodyReplacementComponents());