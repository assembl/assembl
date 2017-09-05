import React from 'react';
import renderer from 'react-test-renderer';

import FileUploader from '../../../../js/app/components/common/fileUploader';

describe('FileUploader component', () => {
  it('should render an image uploader', () => {
    const handleChangeSpy = jest.fn(() => {});
    const component = renderer.create(<FileUploader fileOrUrl="http://www.example.com/foobar.png" handleChange={handleChangeSpy} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an image uploader without preview', () => {
    const handleChangeSpy = jest.fn(() => {});
    const file = new File([''], 'foobar.png');
    const component = renderer.create(<FileUploader fileOrUrl={file} handleChange={handleChangeSpy} withPreview={false} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});