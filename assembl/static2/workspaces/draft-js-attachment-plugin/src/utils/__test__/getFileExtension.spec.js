// @flow
import getFileExtension from '../getFileExtension';

describe('getFileExtension function', () => {
  it('should return the file extension', () => {
    expect(getFileExtension('foobar.doc')).toEqual('doc');
  });

  it('should return unknown if there is no extension', () => {
    expect(getFileExtension('noextension')).toEqual('unknown');
  });
});