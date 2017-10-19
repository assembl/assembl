// @flow
import React from 'react';
import { Map } from 'immutable';

type DocumentExtensionIconProps = {
  filename: string
};

const iconsPath = '/static2/img/icons/black/';
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

  return parts[parts.length - 1];
};

export const getIconPath = (extension: string): string => {
  const icon = mapping.get(extension, defaultIcon);
  return `${iconsPath}${icon}`;
};

const DocumentExtensionIcon = ({ filename }: DocumentExtensionIconProps) => {
  const extension = getExtension(filename);
  const iconPath = getIconPath(extension);
  return <img src={iconPath} alt={extension} width="30px" />;
};

export default DocumentExtensionIcon;