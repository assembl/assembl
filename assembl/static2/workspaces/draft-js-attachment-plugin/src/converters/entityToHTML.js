// @flow
import { type EntityInstance } from 'draft-js';

import getDocumentIconPath from '../utils/getDocumentIconPath';
import getFileExtension from '../utils/getFileExtension';

export default function entityToHTML(entity: EntityInstance): string {
  const { id } = entity.data;
  const src = entity.data.src ? entity.data.src : '';
  const mimeType = entity.data.mimeType ? entity.data.mimeType : '';
  const title = entity.data.title ? entity.data.title : '';
  if (mimeType.startsWith('image')) {
    return `<img class="attachment-image" src="${src}" alt="" title="${title}" data-id="${id}" data-mimetype="${mimeType}" />`;
  }

  const extension = getFileExtension(title);
  const iconPath = getDocumentIconPath(extension);
  return (
    `<a href="${src}" title="${title}">` +
    `<img class="attachment-icon" alt="${extension}" src="${iconPath}" data-id="${id}" data-mimetype="${mimeType}"` +
    ` data-title="${title}" data-externalurl="${src}" />` +
    '</a>'
  );
}