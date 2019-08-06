// @flow
import getDocumentIconPath from '../getDocumentIconPath';
import { ICO_DOC, ICO_PDF, ICO_XLS } from '../../../../../js/app/constants';

describe('getDocumentIconPath function', () => {
  it('should return the path to doc icon', () => {
    const expected = ICO_DOC;
    expect(getDocumentIconPath('doc')).toEqual(expected);
    expect(getDocumentIconPath('docx')).toEqual(expected);
    expect(getDocumentIconPath('odt')).toEqual(expected);
  });

  it('should return the path to pdf icon', () => {
    expect(getDocumentIconPath('pdf')).toEqual(ICO_PDF);
  });

  it('should return the path to xls icon', () => {
    const expected = ICO_XLS;
    expect(getDocumentIconPath('ods')).toEqual(expected);
    expect(getDocumentIconPath('xls')).toEqual(expected);
    expect(getDocumentIconPath('xlsx')).toEqual(expected);
  });

  it('should return the default document icon path if extension is unknown', () => {
    expect(getDocumentIconPath('unknown')).toEqual(ICO_DOC);
  });
});