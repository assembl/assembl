// @flow
import linkifyHtml from 'linkifyjs/html';
import * as linkify from 'linkifyjs';

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