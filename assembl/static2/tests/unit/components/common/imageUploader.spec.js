import React from 'react';
import renderer from 'react-test-renderer';

import ImageUploader from '../../../../js/app/components/common/imageUploader';

describe('ImageUploader component', () => {
  it('should render an image uploader', () => {
    const handleChangeSpy = jest.fn(() => {});
    const file = new File([''], 'foobar.png');
    const component = renderer.create(<ImageUploader file={file} handleChange={handleChangeSpy} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});