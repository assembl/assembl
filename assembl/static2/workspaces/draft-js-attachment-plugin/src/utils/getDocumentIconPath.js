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

export default function (extension: string): string {
  const icon = get(mapping, extension, defaultIcon);
  return `${iconsPath}${icon}`;
}