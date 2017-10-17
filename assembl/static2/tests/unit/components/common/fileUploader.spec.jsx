import React from 'react';
import renderer from 'react-test-renderer';

import FileUploader from '../../../../js/app/components/common/fileUploader';

describe('FileUploader component', () => {
  it('should render a file uploader for an image file', () => {
    const handleChangeSpy = jest.fn(() => {});
    const component = renderer.create(
      <FileUploader fileOrUrl="http://www.example.com/foobar.png" handleChange={handleChangeSpy} />
    );
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a file uploader without preview', () => {
    const handleChangeSpy = jest.fn(() => {});
    const file = new File([''], 'foobar.png');
    const component = renderer.create(<FileUploader fileOrUrl={file} handleChange={handleChangeSpy} withPreview={false} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render a file uploader with the filename if the file is not an image', () => {
    // FIXME: due to the async nature of FileReader, it is very difficult to really render the filename in the snapshot
    const handleChangeSpy = jest.fn(() => {});
    const file = new File([''], 'foobar.pdf');
    const component = renderer.create(<FileUploader fileOrUrl={file} handleChange={handleChangeSpy} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});