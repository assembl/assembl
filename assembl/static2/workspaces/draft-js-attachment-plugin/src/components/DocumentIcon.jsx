// @flow
import * as React from 'react';
import { ContentState } from 'draft-js';
import type { ContentBlock } from 'draft-js';
import get from 'lodash/get';

const iconsPath = '/static2/img/icons/black/';
const defaultIcon = 'doc.svg';
const mapping = {
  doc: 'doc.svg',
  docx: 'doc.svg',
  odt: 'doc.svg',
  pdf: 'pdf.svg',
  xls: 'xls.svg',
  xlsx: 'xls.svg',
  ods: 'xls.svg',
  unknown: defaultIcon
};

export const getExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length === 1) {
    return 'unknown';
  }

  return parts[parts.length - 1];
};

export const getIconPath = (extension: string): string => {
  const icon = get(mapping, extension, defaultIcon);
  return `${iconsPath}${icon}`;
};

const DocumentIcon = ({ block, contentState }: { block: ContentBlock, contentState: ContentState }) => {
  const entityKey = block.getEntityAt(0);
  const entity = contentState.getEntity(entityKey);
  const data = entity.getData();
  const type = entity.getType();
  if (type === 'DOCUMENT') {
    const extension = getExtension(data.title);
    const iconPath = getIconPath(extension);
    return (
      <div className="atomic-block" data-blocktype="atomic">
        <img className="attachment-icon" src={iconPath} alt={extension} />
      </div>
    );
  }

  return <div />;
};

export default DocumentIcon;