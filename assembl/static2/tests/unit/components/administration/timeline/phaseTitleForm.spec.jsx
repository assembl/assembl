import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { DumbPhaseTitleForm } from '../../../../../js/app/components/administration/discussion/phaseTitleForm';

describe('PhaseTitleForm component', () => {
  const handleTitleChangeSpy = jest.fn(() => {});
  const handleDeleteClickSpy = jest.fn(() => {});

  it('should render a form to update the phase\'s title', () => {
    const props = {
      id: '123',
      title: 'Une phase intéressante',
      editLocale: 'fr',
      handleTitleChange: handleTitleChangeSpy,
      handleDeleteClick: handleDeleteClickSpy,
      phaseIndex: 1
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbPhaseTitleForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});