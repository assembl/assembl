// @flow
import linkifyHtml from 'linkifyjs/html';
import * as linkify from 'linkifyjs';

export function transformLinksInHtml(html: string): string {
  const linksToReplace = linkify
    .find(html)
    .map((link) => {
      const url = link.href;
      if (url.startsWith('https://www.youtube.com') || url.startsWith('https://youtube.com')) {
        const re = /(.*watch\?v=(.*?))([\s<,;].*)/;
        const result = url.match(re);
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
      }

      return null;
    })
    // remove null values
    .filter((link) => {
      return link;
    });

  let transformedHtml = html;
  linksToReplace.forEach((linkToReplace) => {
    transformedHtml = html.replace(linkToReplace.origin, linkToReplace.dest);
  });

  return linkifyHtml(transformedHtml);
}