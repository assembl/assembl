// @flow
import linkifyHtml from 'linkifyjs/html';
import * as linkify from 'linkifyjs';

import { getURLMetadata } from './urlPreview';

type LinkToReplace = {
  dest: string,
  origin: string
};

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
  // first, we add spaces before </p> to help linkify
  const htmlForLinkify = html.replace(/<\/p>/gi, ' </p>');
  const linksToReplace: Array<LinkToReplace> = linkify
    .find(htmlForLinkify)
    .map((link: LinkifyLink) => {
      const url = link.href;
      const metadata = getURLMetadata(url);
      if (metadata) {
        return {
          origin: new RegExp(url.replace(/[-/\\^$*+?.()|[\]{}]/gm, '\\$&'), 'g'),
          dest: url + metadata.html
        };
      }

      return null;
    })
    // remove null values
    .filter((link: LinkToReplace | null) => link);

  let transformedHtml = html;
  linksToReplace.forEach((linkToReplace: LinkToReplace) => {
    transformedHtml = transformedHtml.replace(linkToReplace.origin, linkToReplace.dest);
  });

  return linkifyHtml(transformedHtml);
}