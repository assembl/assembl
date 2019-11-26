// @flow
import * as React from 'react';
import { Map } from 'immutable';

import { getIconPath } from '../../utils/globalFunctions';

type DocumentExtensionIconProps = {
  filename: string
};

const defaultIcon = 'doc.svg';
const mapping = Map({
  doc: 'doc.svg',
  docx: 'doc.svg',
  odt: 'doc.svg',
  pdf: 'pdf.svg',
  xls: 'xls.svg',
  xlsx: 'xls.svg',
  ods: 'xls.svg',
  unknown: defaultIcon
});

export const getExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length === 1) {
    return 'unknown';
  }

  return parts[parts.length - 1].toLowerCase();
};

export const getIconPathByExtension = (extension: string): string => {
  const icon = mapping.get(extension, defaultIcon);
  return getIconPath(icon, 'black');
};

const DocumentExtensionIcon = ({ filename }: DocumentExtensionIconProps) => {
  const extension = getExtension(filename);
  const iconPath = getIconPathByExtension(extension);
  return <img className="attachment-icon" src={iconPath} alt={extension} />;
};

export default DocumentExtensionIcon;