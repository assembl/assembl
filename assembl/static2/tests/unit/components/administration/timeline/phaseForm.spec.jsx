import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import moment from 'moment';
import { DumbPhaseForm } from '../../../../../js/app/components/administration/discussion/phaseForm';

describe('PhaseForm component', () => {
  const handleIdentifierChangeSpy = jest.fn(() => {});
  const handleStartDateChangeSpy = jest.fn(() => {});
  const handleEndDateChangeSpy = jest.fn(() => {});
  const commonProps = {
    phaseId: '1234',
    phaseNumber: 1,
    handleIdentifierChange: handleIdentifierChangeSpy,
    handleStartDateChange: handleStartDateChangeSpy,
    handleEndDateChange: handleEndDateChangeSpy,
    identifier: 'survey',
    start: moment('2014-12-31T09:00:00+00:00'),
    end: moment('2015-12-31T09:00:00+00:00'),
    locale: 'fr'
  };
  it('should render a form to update the dates and module of a new phase', () => {
    const props = {
      ...commonProps,
      isNew: true
    };

    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbPhaseForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  it('should render a form to update an old phase, hence with a disabled menu for module', () => {
    const props = {
      ...commonProps,
      isNew: false
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbPhaseForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});