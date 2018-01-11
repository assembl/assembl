// @flow
import linkifyHtml from 'linkifyjs/html';
import * as linkify from 'linkifyjs';

import { youtubeRegexp } from './globalFunctions';

type LinkToReplace = {
  dest: string,
  origin: string
};

type LinkifyLink = {
  href: string,
  type: string,
  value: string
};

export function transformLinksInHtml(html: string): string {
  // first, we add spaces before </p> to help linkify
  const htmlForLinkify = html.replace(/<\/p>/gi, ' </p>');
  const linksToReplace: Array<LinkToReplace> = linkify
    .find(htmlForLinkify)
    .map((link: LinkifyLink) => {
      const url = link.href;
      const result = url.match(youtubeRegexp);

      if (result) {
        const videoId = result[1];
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        const embeddedIFrame = `<div><iframe title="" src="${embedUrl}" frameborder="0" class="embedded-video" allowfullscreen></iframe></div>`;
        return {
          origin: new RegExp(url.replace(/[-/\\^$*+?.()|[\]{}]/gm, '\\$&'), 'g'),
          dest: url + embeddedIFrame
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