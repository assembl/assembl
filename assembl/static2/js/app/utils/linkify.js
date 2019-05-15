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
  const url = /(<a href="(https:\/\/(share.mindmanager.com|embed.coggle.it)[^\s]+)".*?<\/a>)/gi;
  return html.replace(url, '<div class="iframed"><iframe src="$2"></iframe></div>');
}

export function addIframeForStoryChief(html: string): string {
  const url = /(<a href="(https:\/\/(bluenovev3.storychief.io)[^\s]+)".*?<\/a>)/gi;
  return html.replace(url, '<div class="iframed"><iframe src="$2" width="100%" height="1500px"></iframe></div>');
}

export const renderSynthesisBody = (text: string) =>
  activeHtml(text && addIframeForStoryChief(transformLinksInHtml(text)), postBodyReplacementComponents());

export const renderRichtext = (text: string) => activeHtml(text && transformLinksInHtml(text), postBodyReplacementComponents());