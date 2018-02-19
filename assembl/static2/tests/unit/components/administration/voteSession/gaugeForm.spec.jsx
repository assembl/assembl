import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import { DumbGaugeForm } from '../../../../../js/app/components/administration/voteSession/gaugeForm';
import { textChoices } from './fakeData';

describe('ModulesSection component', () => {
  const handleInstructionsChange = jest.fn(() => {});
  const handleNbTicksSelectChange = jest.fn(() => {});
  const handleNumberGaugeCheck = jest.fn(() => {});
  const handleNumberGaugeUncheck = jest.fn(() => {});

  it('should render a form to set up a gauge and a numberGaugeForm below', () => {
    const props = {
      id: '1234',
      editLocale: 'en',
      instructions: 'Please vote on this numeral gauge',
      nbTicks: 10,
      isNumberGauge: true,
      choices: null,
      handleInstructionsChange: handleInstructionsChange,
      handleNbTicksSelectChange: handleNbTicksSelectChange,
      handleNumberGaugeCheck: handleNumberGaugeCheck,
      handleNumberGaugeUncheck: handleNumberGaugeUncheck,
      index: 1
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbGaugeForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
  it('should render a form to set up a gauge and a textGaugeForm below', () => {
    const props = {
      id: '5678',
      editLocale: 'en',
      instructions: 'Please vote on this textual gauge',
      nbTicks: 2,
      isNumberGauge: false,
      choices: textChoices,
      handleInstructionsChange: handleInstructionsChange,
      handleNbTicksSelectChange: handleNbTicksSelectChange,
      handleNumberGaugeCheck: handleNumberGaugeCheck,
      handleNumberGaugeUncheck: handleNumberGaugeUncheck,
      index: 1
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbGaugeForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});