// @flow
import linkifyHtml from 'linkifyjs/html';
import * as linkify from 'linkifyjs';

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
  const linksToReplace: Array<LinkToReplace> = linkify
    .find(html)
    .map((link: LinkifyLink) => {
      const url = link.href;
      // youtu.be
      const dotBeRe = /(https?:\/\/\w*\.?youtu.be\/(.*?))([\s<,;].*)/;
      let result = url.match(dotBeRe);
      if (!result) {
        // youtube.com
        const dotComRe = /(https?:\/\/\w*\.?youtube\.com\/watch\?v=(.*?))([\s<,;].*)/;
        result = url.match(dotComRe);
      }

      if (result) {
        const videoUrl = result[1];
        const videoId = result[2];
        const rest = result[3];
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        const embeddedIFrame = `<div><iframe title="" src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>`;
        return {
          origin: url,
          dest: videoUrl + embeddedIFrame + rest
        };
      }

      return null;
    })
    // remove null values
    .filter((link: LinkToReplace | null) => {
      return link;
    });

  let transformedHtml = html;
  linksToReplace.forEach((linkToReplace: LinkToReplace) => {
    transformedHtml = html.replace(linkToReplace.origin, linkToReplace.dest);
  });

  return linkifyHtml(transformedHtml);
}