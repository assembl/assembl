import React from 'react';
import renderer from 'react-test-renderer';

import DocumentExtensionIcon, {
  getExtension,
  getIconPathByExtension
} from '../../../../js/app/components/common/documentExtensionIcon';

describe('getExtension function', () => {
  it('should return the extension from filename', () => {
    const actual = getExtension('foo.bar.jpg');
    const expected = 'jpg';
    expect(actual).toEqual(expected);
  });

  it('should return the extension from filename with multiple consecutive dots', () => {
    const actual = getExtension('foo..jpg');
    const expected = 'jpg';
    expect(actual).toEqual(expected);
  });

  it('should return unknown if filename has no dot', () => {
    const actual = getExtension('foobar');
    const expected = 'unknown';
    expect(actual).toEqual(expected);
  });
});

describe('getIconPath function', () => {
  it('should return the path of the corresponding icon', () => {
    const actual = getIconPathByExtension('docx');
    const expected = '/static2/img/icons/black/doc.svg';
    expect(actual).toEqual(expected);
  });

  it('should return the path of the default icon', () => {
    const actual = getIconPathByExtension('unknown');
    const expected = '/static2/img/icons/black/doc.svg';
    expect(actual).toEqual(expected);
  });
});

describe('DocumentExtensionIcon component', () => {
  it('should render an icon depending on the extension of the file', () => {
    const props = {
      filename: 'foobar.doc'
    };
    const component = renderer.create(<DocumentExtensionIcon {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});