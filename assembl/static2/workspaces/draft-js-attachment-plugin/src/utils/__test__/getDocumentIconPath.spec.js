// @flow
import getDocumentIconPath from '../getDocumentIconPath';

describe('getDocumentIconPath function', () => {
  it('should return the path to doc icon', () => {
    const expected = '/static2/img/icons/black/doc.svg';
    expect(getDocumentIconPath('doc')).toEqual(expected);
    expect(getDocumentIconPath('docx')).toEqual(expected);
    expect(getDocumentIconPath('odt')).toEqual(expected);
  });

  it('should return the path to pdf icon', () => {
    expect(getDocumentIconPath('pdf')).toEqual('/static2/img/icons/black/pdf.svg');
  });

  it('should return the path to xls icon', () => {
    const expected = '/static2/img/icons/black/xls.svg';
    expect(getDocumentIconPath('ods')).toEqual(expected);
    expect(getDocumentIconPath('xls')).toEqual(expected);
    expect(getDocumentIconPath('xlsx')).toEqual(expected);
  });

  it('should return the default document icon path if extension is unknown', () => {
    expect(getDocumentIconPath('unknown')).toEqual('/static2/img/icons/black/doc.svg');
  });
});