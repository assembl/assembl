// @flow
import { type EntityInstance } from 'draft-js';

export default function (entity: EntityInstance, originalText: string) {
  const { target, title, url } = entity.data;
  const targetAttr = target ? ` target="${target}"` : '';
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${url}"${targetAttr}${titleAttr}>${originalText}</a>`;
}