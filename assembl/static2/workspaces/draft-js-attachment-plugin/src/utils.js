// @flow
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