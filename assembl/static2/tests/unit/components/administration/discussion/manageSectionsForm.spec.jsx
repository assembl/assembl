import React from 'react';
import { List } from 'immutable';
import ShallowRenderer from 'react-test-renderer/shallow';
import { DumbManageSectionsForm } from '../../../../../js/app/components/administration/discussion/manageSectionsForm';
import '../../../../helpers/setupTranslations';

describe('DumbManageSectionsForm component', () => {
  it('should render a list of forms to edit Assembl sections', () => {
    const createSectionSpy = jest.fn(() => {});
    const props = {
      sections: List.of('123', '456', '789'),
      editLocale: 'en',
      createSection: createSectionSpy
    };
    const renderer = new ShallowRenderer();
    renderer.render(<DumbManageSectionsForm {...props} />);
    const rendered = renderer.getRenderOutput();
    expect(rendered).toMatchSnapshot();
  });
});