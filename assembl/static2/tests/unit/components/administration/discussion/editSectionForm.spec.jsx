import React from 'react';
import renderer from 'react-test-renderer';

import { DumbEditSectionForm } from '../../../../../js/app/components/administration/discussion/editSectionForm';
import '../../../../helpers/setupTranslations';

describe('DumbEditSectionForm component', () => {
  it('should render a form to edit a section of Assembl', () => {
    const handleTitleChangeSpy = jest.fn(() => {});
    const handleUrlChangeSpy = jest.fn(() => {});
    const toggleExternalPageFieldSpy = jest.fn(() => {});
    const handleDeleteClickSpy = jest.fn(() => {});
    const handleDownClickSpy = jest.fn(() => {});
    const handleUpClickSpy = jest.fn(() => {});
    const props = {
      handleTitleChange: handleTitleChangeSpy,
      handleUrlChange: handleUrlChangeSpy,
      toggleExternalPageField: toggleExternalPageFieldSpy,
      handleDeleteClick: handleDeleteClickSpy,
      handleDownClick: handleDownClickSpy,
      handleUpClick: handleUpClickSpy,
      url: 'www.google.fr',
      type: 'HOMEPAGE',
      title: 'Accueil',
      nbSections: 3,
      index: 0
    };
    const component = renderer.create(<DumbEditSectionForm {...props} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});