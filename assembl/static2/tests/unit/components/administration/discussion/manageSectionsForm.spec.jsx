import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { DumbManageSectionsForm } from '../../../../../js/app/components/administration/discussion/manageSectionsForm';

describe('DumbManageSectionsForm component', () => {
  it('should render a list of forms to edit Assembl sections', () => {
    const createSectionSpy = jest.fn(() => {});
    const props = {
      sections: ['123', '456', '789'],
      selectedLocale: 'en',
      createSection: createSectionSpy
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbManageSectionsForm {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});