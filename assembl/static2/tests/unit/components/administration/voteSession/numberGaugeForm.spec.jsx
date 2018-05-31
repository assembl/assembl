import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';

import DumbNumberGaugeForm from '../../../../../js/app/components/administration/voteSession/numberGaugeForm';

describe('DumbNumberGaugeForm component', () => {
  const handleMinChange = jest.fn(() => {});
  const handleMaxChange = jest.fn(() => {});
  const handleUnitChange = jest.fn(() => {});

  it('should render a form to set up a numeral gauge', () => {
    const props = {
      minimum: 2,
      maximum: 11,
      unit: 'kms',
      handleMaxChange: handleMaxChange,
      handleMinChange: handleMinChange,
      handleUnitChange: handleUnitChange
    };
    const shallowRenderer = new ShallowRenderer();
    shallowRenderer.render(<DumbNumberGaugeForm {...props} />);
    const result = shallowRenderer.getRenderOutput();
    expect(result).toMatchSnapshot();
  });
});