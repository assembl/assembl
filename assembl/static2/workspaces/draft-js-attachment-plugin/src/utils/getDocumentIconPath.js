// @flow
import get from 'lodash/get';
import { PICTURE_BASE_URL } from '../../../../js/app/constants';

const iconsPath = PICTURE_BASE_URL;

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
  return `${iconsPath}/${icon}`;
}