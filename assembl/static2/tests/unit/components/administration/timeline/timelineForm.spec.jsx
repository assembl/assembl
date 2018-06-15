import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import { DumbTimelineForm } from '../../../../../js/app/components/administration/discussion/timelineForm';

describe('TimelineForm component', () => {
  const handleCreatePhaseSpy = jest.fn(() => {});
  it('should render a form to create, delete and edit the title of the phases', () => {
    const props = {
      editLocale: 'fr',
      phases: ['123', '345', '456'],
      handleCreatePhase: handleCreatePhaseSpy
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbTimelineForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});