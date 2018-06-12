import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbCustomizeHeader } from '../../../../../js/app/components/administration/landingPage/customizeHeader';

describe('ManageModules component', () => {
  it('should render a page to manage the landing page header', () => {
    const handleTitleChange = jest.fn(() => {});
    const handleSubtitleChange = jest.fn(() => {});
    const handleButtonLabelChange = jest.fn(() => {});
    const handleImageChange = jest.fn(() => {});
    const handleLogoChange = jest.fn(() => {});
    const header = {
      title: 'title',
      subtitle: 'subtitle',
      buttonLabel: 'button label',
      headerImgMimeType: 'image/jpeg',
      headerImgUrl: 'img/headerImg.jpg',
      headerImgTitle: 'myHeaderImage',
      logoImgMimeType: 'image/jpeg',
      logoImgUrl: 'img/logoImg.jpg',
      logoImgTitle: 'myLogoImage'
    };
    const props = {
      header: header,
      handleTitleChange: handleTitleChange,
      handleSubtitleChange: handleSubtitleChange,
      handleButtonLabelChange: handleButtonLabelChange,
      handleImageChange: handleImageChange,
      handleLogoChange: handleLogoChange
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbCustomizeHeader {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});