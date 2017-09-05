import React from 'react';
import renderer from 'react-test-renderer';

import ImageUploader from '../../../../js/app/components/common/imageUploader';

describe('ImageUploader component', () => {
  it('should render an image uploader', () => {
    const handleChangeSpy = jest.fn(() => {});
    const component = renderer.create(<ImageUploader imgUrl="http://www.example.com/foobar.png" handleChange={handleChangeSpy} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('should render an image uploader without preview', () => {
    const handleChangeSpy = jest.fn(() => {});
    const file = new File([''], 'foobar.png');
    const component = renderer.create(<ImageUploader imgUrl={file} handleChange={handleChangeSpy} withPreview={false} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});